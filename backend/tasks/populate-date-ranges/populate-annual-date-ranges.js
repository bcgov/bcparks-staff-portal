// This script populates DateRanges for a given target year
// based on previous year's DateRanges if isDateRangeAnnual is TRUE.

import "../../env.js";

import {
  Season,
  DateRange,
  DateRangeAnnual,
  DateType,
} from "../../models/index.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import resolveNewSeasonStatus from "../../utils/resolveNewSeasonStatus.js";

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

    const dateRangesToCreate = [];

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

      const prevSeason = await Season.findOne({
        where: {
          publishableId,
          operatingYear: targetYear - 1,
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

      // Skip to the next DateRangeAnnual if there are no previous DateRanges to copy
      if (prevDateRanges.length === 0) continue;

      let targetSeason = await Season.findOne({
        where: {
          publishableId,
          operatingYear: targetYear,
          seasonType: prevSeason.seasonType,
        },
        transaction,
      });

      // create season if no target season found
      // @TODO: Update criteria to create seasons in create-seasons/create-winter-seasons instead
      if (!targetSeason) {
        // Determine the status of the new season based on annual dates
        const status = await resolveNewSeasonStatus(
          publishableId,
          prevSeason.seasonType,
          transaction,
        );

        targetSeason = await Season.create(
          {
            publishableId,
            operatingYear: targetYear,
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

      // If we have the same number of complete ranges as previous year, skip
      const completeTargetRanges = existingTargetDateRanges.filter(
        (range) => range.startDate && range.endDate,
      );

      if (completeTargetRanges.length >= prevDateRanges.length) {
        // Target season already has complete date ranges for this dateType
        continue;
      }

      // Only copy ranges that don't already exist (avoiding duplicates)
      const numRangesToCopy =
        prevDateRanges.length - completeTargetRanges.length;

      if (numRangesToCopy <= 0) {
        continue;
      }

      // copy each previous DateRange to current season (only the missing ones)
      for (let i = 0; i < numRangesToCopy; i++) {
        const prevRange = prevDateRanges[i];
        const currentYear = targetSeason.operatingYear;
        const prevStartDate = new Date(prevRange.startDate);
        const prevEndDate = new Date(prevRange.endDate);

        const newStartDate = new Date(prevStartDate);
        const newEndDate = new Date(prevEndDate);

        // Calculate the year difference between the previous end and start dates
        // to handle dates that span two calendar years (e.g., Nov 2026 to March 2027)
        const yearDifference =
          prevEndDate.getFullYear() - prevStartDate.getFullYear();

        newStartDate.setFullYear(currentYear);
        newEndDate.setFullYear(currentYear + yearDifference);

        dateRangesToCreate.push({
          dateableId,
          seasonId: targetSeason.id,
          dateTypeId,
          startDate: newStartDate,
          endDate: newEndDate,
        });

        console.log(
          `Copied DateRange from season ${prevSeason.operatingYear} to ${targetSeason.operatingYear} for publishableId=${publishableId}`,
        );
      }
    }

    if (dateRangesToCreate.length > 0) {
      await DateRange.bulkCreate(dateRangesToCreate, { transaction });
      console.log(`Created ${dateRangesToCreate.length} new DateRanges.`);
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
