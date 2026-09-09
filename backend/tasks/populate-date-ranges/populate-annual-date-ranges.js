// This script populates DateRanges for a given target year
// based on previous year's DateRanges if isDateRangeAnnual is TRUE.

import "../../env.js";
import { addYears, format, getYear, parseISO } from "date-fns";
import { Op } from "sequelize";

import {
  Season,
  DateRange,
  DateRangeAnnual,
  DateType,
  Feature,
  FeatureType,
} from "../../models/index.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as FEATURE_TYPE from "../../constants/featureType.js";
import resolveSeasonCreationStatus from "../../utils/resolveSeasonCreationStatus.js";

// Functions

export async function populateAnnualDateRangesForYear(
  targetYear,
  transaction = null,
) {
  try {
    // find all DateRangeAnnuals where isDateRangeAnnual is TRUE
    const annuals = await DateRangeAnnual.findAll({
      include: [
        {
          model: DateType,
          as: "dateType",
          attributes: ["dateTypeNumber"],
        },
      ],

      where: { isDateRangeAnnual: true },
      order: [
        ["publishableId", "ASC"],
        ["dateableId", "ASC"],
        ["dateTypeId", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });

    // build a lookup set of dateableIds for features with 12-month
    // booking windows (Group Campgrounds and Picnic Shelters).
    const twelveMonthBookingDateableIds = new Set(
      (
        await Feature.findAll({
          attributes: ["dateableId"],
          where: {
            inReservationSystem: true,
            dateableId: {
              [Op.in]: [
                ...new Set(annuals.map(({ dateableId }) => dateableId)),
              ],
            },
          },
          include: [
            {
              model: FeatureType,
              as: "featureType",
              attributes: [],
              required: true,
              where: {
                featureTypeNumber: {
                  [Op.in]: [
                    FEATURE_TYPE.GROUP_CAMPGROUND,
                    FEATURE_TYPE.PICNIC_SHELTER,
                  ],
                },
              },
            },
          ],
          transaction,
        })
      ).map(({ dateableId }) => dateableId),
    );

    const dateRangesToCreate = new Map();

    for (const annual of annuals) {
      const { id, publishableId, dateTypeId, dateableId, dateType } = annual;

      // Find the previous season for this DateRangeAnnual

      if (!dateType) {
        throw new Error(`DateType missing for DateRangeAnnual ${id}`);
      }

      // Season type based on the date type of the DateRangeAnnual
      const seasonType =
        dateType.dateTypeNumber === DATE_TYPE.WINTER_FEE
          ? SEASON_TYPE.WINTER
          : SEASON_TYPE.REGULAR;

      // For features with 12-month booking windows, populate the next operating year.
      const adjustedTargetYear = twelveMonthBookingDateableIds.has(dateableId)
        ? targetYear + 1
        : targetYear;

      const prevSeason = await Season.findOne({
        where: {
          publishableId,
          operatingYear: adjustedTargetYear - 1,
          seasonType,
        },
        transaction,
      });

      if (!prevSeason) continue;

      // Find previous-season DateRanges for this dateable+dateType
      const prevDateRanges = await DateRange.findAll({
        where: {
          seasonId: prevSeason.id,
          dateableId,
          dateTypeId,
        },
        order: [
          ["startDate", "ASC"],
          ["endDate", "ASC"],
          ["id", "ASC"],
        ],
        transaction,
      });

      // Only copy complete previous ranges; skip placeholders with null dates.
      const completePrevRanges = prevDateRanges.filter(
        (range) => range.startDate && range.endDate,
      );

      // Skip to the next DateRangeAnnual if there are no previous DateRanges to copy
      if (completePrevRanges.length === 0) continue;

      let targetSeason = await Season.findOne({
        where: {
          publishableId,
          operatingYear: adjustedTargetYear,
          seasonType: prevSeason.seasonType,
        },
        transaction,
      });

      // create season if no target season found
      // @TODO: Update criteria to create seasons in create-seasons/create-winter-seasons instead
      if (!targetSeason) {
        // Determine the status of the new season based on annual dates
        const status = await resolveSeasonCreationStatus(
          publishableId,
          prevSeason.seasonType,
          transaction,
        );

        targetSeason = await Season.create(
          {
            publishableId,
            operatingYear: adjustedTargetYear,
            status,
            readyToPublish: true,
            seasonType: prevSeason.seasonType,
          },
          { transaction },
        );
      }

      // For winter seasons, only copy Winter fee date types
      if (targetSeason.seasonType === SEASON_TYPE.WINTER) {
        if (dateType.dateTypeNumber !== DATE_TYPE.WINTER_FEE) {
          console.log(
            `Skipping non-winter fee dates for winter season ${targetSeason.operatingYear} (publishableId=${publishableId})`,
          );
          continue;
        }
      }

      // check if target season already has DateRanges for this dateable+dateType
      const existingTargetDateRanges = await DateRange.findAll({
        where: {
          seasonId: targetSeason.id,
          dateableId,
          dateTypeId,
        },
        order: [
          ["startDate", "ASC"],
          ["endDate", "ASC"],
          ["id", "ASC"],
        ],
        transaction,
      });

      // If there are any complete target ranges, skip copying for this dateable+dateType
      if (
        existingTargetDateRanges.some(
          (range) => range.startDate && range.endDate,
        )
      ) {
        continue;
      }

      // transform previous ranges into the target operating year
      const transformedRanges = completePrevRanges.map((prevRange) => {
        const currentYear = targetSeason.operatingYear;
        const prevStartDate = parseISO(prevRange.startDate);
        const prevEndDate = parseISO(prevRange.endDate);

        // Shift this previous range into the target operating year while preserving
        // the start/end year relationship for cross-year ranges.
        const targetYearOffset = currentYear - getYear(prevStartDate);

        const newStartDate = addYears(prevStartDate, targetYearOffset);
        const newEndDate = addYears(prevEndDate, targetYearOffset);

        return {
          dateableId,
          seasonId: targetSeason.id,
          dateTypeId,
          startDate: format(newStartDate, "yyyy-MM-dd"),
          endDate: format(newEndDate, "yyyy-MM-dd"),
        };
      });

      // validatate the transformed ranges for date overlaps so we don't insert bad data
      const rangeGroupKey = `${targetSeason.id}:${dateableId}:${dateTypeId}`;
      const rangeGroup = dateRangesToCreate.get(rangeGroupKey) ?? [];
      const rangesToValidate = [...rangeGroup, ...transformedRanges];
      const hasOverlappingRanges = rangesToValidate.some((range, index) =>
        rangesToValidate
          .slice(index + 1)
          .some(
            (otherRange) =>
              range.startDate <= otherRange.endDate &&
              range.endDate >= otherRange.startDate,
          ),
      );

      // Skip the entire group if any source range overlaps another range.
      if (hasOverlappingRanges) {
        console.warn(
          `Skipping ${transformedRanges.length} annual DateRange(s) for dateTypeId=${dateTypeId} from ${prevSeason.operatingYear} to ${targetSeason.operatingYear} for publishableId=${publishableId} due to overlapping dates.`,
        );
        dateRangesToCreate.delete(rangeGroupKey);
        continue;
      }

      rangeGroup.push(...transformedRanges);
      dateRangesToCreate.set(rangeGroupKey, rangeGroup);

      console.log(
        `Copied ${transformedRanges.length} annual DateRange(s) for dateTypeId=${dateTypeId} from ${prevSeason.operatingYear} to ${targetSeason.operatingYear} for publishableId=${publishableId}`,
      );
    }

    const newDateRanges = [...dateRangesToCreate.values()].flat();

    if (newDateRanges.length > 0) {
      await DateRange.bulkCreate(newDateRanges, { transaction });
      console.log(`Created ${newDateRanges.length} new DateRanges.`);
    } else {
      console.log("No new DateRanges to create.");
    }
    console.log(
      "DateRanges populated for new Seasons based on previous year's annual DateRanges.",
    );
  } catch (err) {
    console.error("Error populating annual DateRanges:", err);
    throw err;
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const targetYear = process.argv[2];
  const transaction = await DateRange.sequelize.transaction();

  try {
    if (!targetYear || isNaN(targetYear)) {
      console.error(
        "Please provide a target year. e.g. node populate-annual-date-ranges.js 2026",
      );
      throw new Error("Invalid or missing target year argument.");
    }

    await populateAnnualDateRangesForYear(Number(targetYear), transaction);
    await transaction.commit();
    console.log("Transaction committed.");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
