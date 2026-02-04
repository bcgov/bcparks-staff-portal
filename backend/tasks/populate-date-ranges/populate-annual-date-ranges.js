// This script populates DateRanges for a given target year
// based on previous year's DateRanges if isDateRangeAnnual is TRUE.

import "../../env.js";

import { Season, DateRange, DateRangeAnnual } from "../../models/index.js";
import { findDateableIdByPublishableId } from "../../utils/findDateableIdByPublishableId.js";
import * as STATUS from "../../constants/seasonStatus.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as DATE_TYPE from "../../constants/dateType.js";

// Functions

export async function populateAnnualDateRangesForYear(
  targetYear,
  transaction = null,
) {
  try {
    // find all DateRangeAnnuals where isDateRangeAnnual is TRUE
    const annuals = await DateRangeAnnual.findAll({
      where: { isDateRangeAnnual: true },
      transaction,
    });

    const dateRangesToCreate = [];

    for (const annual of annuals) {
      // find previous and target seasons for this publishable
      const prevSeason = await Season.findOne({
        where: {
          publishableId: annual.publishableId,
          operatingYear: targetYear - 1,
        },
        transaction,
      });
      let targetSeason = await Season.findOne({
        where: {
          publishableId: annual.publishableId,
          operatingYear: targetYear,
        },
        transaction,
      });

      // skip if no previous season found
      if (!prevSeason) continue;

      // create season if no target season found
      if (!targetSeason) {
        targetSeason = await Season.create(
          {
            publishableId: annual.publishableId,
            operatingYear: targetYear,
            status: STATUS.APPROVED,
            readyToPublish: true,
            seasonType: prevSeason.seasonType,
          },
          { transaction },
        );
      }

      // For winter seasons, only copy Winter fee date types
      if (targetSeason.seasonType === SEASON_TYPE.WINTER) {
        if (annual.dateTypeId !== DATE_TYPE.WINTER_FEE) {
          console.log(
            `Skipping non-winter fee dates for winter season ${targetSeason.operatingYear} (publishableId=${annual.publishableId})`,
          );
          continue;
        }
      }

      // find dateableId for targetSeason's Park/ParkArea/Feature by publishableId
      const dateableId = await findDateableIdByPublishableId(
        targetSeason.publishableId,
        transaction,
      );

      // find DateRanges for previous season and this dateType
      const prevDateRanges = await DateRange.findAll({
        where: {
          seasonId: prevSeason.id,
          dateTypeId: annual.dateTypeId,
        },
        transaction,
      });

      // check if target season already has DateRanges for this dateType
      const existingTargetDateRanges = await DateRange.findAll({
        where: {
          seasonId: targetSeason.id,
          dateTypeId: annual.dateTypeId,
        },
        transaction,
      });

      // If we have the same number of complete ranges as previous year, skip
      const completeTargetRanges = existingTargetDateRanges.filter(
        (range) => range.startDate && range.endDate,
      );

      if (completeTargetRanges.length >= prevDateRanges.length) {
        console.log(
          `Target season ${targetSeason.operatingYear} already has ${completeTargetRanges.length} complete date ranges for dateType ${annual.dateTypeId}, skipping`,
        );
        continue;
      }

      // Only copy ranges that don't already exist (avoiding duplicates)
      const numRangesToCopy =
        prevDateRanges.length - completeTargetRanges.length;

      if (numRangesToCopy <= 0) {
        console.log(
          `Target season ${targetSeason.operatingYear} already has enough date ranges for dateType ${annual.dateTypeId}, skipping`,
        );
        continue;
      }

      // copy each previous DateRange to current season (only the missing ones)
      for (let i = 0; i < numRangesToCopy; i++) {
        const prevRange = prevDateRanges[i];
        const currentYear = targetSeason.operatingYear;
        const prevStartDate = prevRange.startDate;
        const prevEndDate = prevRange.endDate;

        const newStartDate = new Date(prevStartDate);
        const newEndDate = new Date(prevEndDate);

        newStartDate.setFullYear(currentYear);
        newEndDate.setFullYear(currentYear);

        dateRangesToCreate.push({
          dateableId,
          seasonId: targetSeason.id,
          dateTypeId: annual.dateTypeId,
          startDate: newStartDate,
          endDate: newEndDate,
        });

        console.log(
          `Copied DateRange from season ${prevSeason.operatingYear} to ${targetSeason.operatingYear} for publishableId=${annual.publishableId}`,
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
