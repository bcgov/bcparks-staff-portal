// This script populates DateRanges for a given target year
// based on previous year's DateRanges if isDateRangeAnnual is TRUE.

import "../../env.js";

import { Season, DateRange, DateRangeAnnual } from "../../models/index.js";
import { findDateableIdByPublishableId } from "../../utils/findDateableIdByPublishableId.js";

// Functions
/**
 * Converts a UTC Date to a local Date at midnight on the same day
 * (Removes 7/8 hours from a UTC Date at midnight)
 * @param {Date|null} dateObject UTC zoned date object
 * @returns {Date|null} local date object
 */
export function normalizeToLocalDate(dateObject) {
  // Allow null dates to pass through
  if (!dateObject) return null;

  return new Date(
    dateObject.getUTCFullYear(),
    dateObject.getUTCMonth(),
    dateObject.getUTCDate(),
  );
}

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
      const targetSeason = await Season.findOne({
        where: {
          publishableId: annual.publishableId,
          operatingYear: targetYear,
        },
        transaction,
      });

      // skip if no previous or target season found
      if (!prevSeason || !targetSeason) continue;

      // find dateableId for targetSeason's publishableId
      const dateableId = await findDateableIdByPublishableId(
        targetSeason.publishableId,
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
      const targetDateRangeCount = await DateRange.count({
        where: {
          seasonId: targetSeason.id,
          dateTypeId: annual.dateTypeId,
        },
        transaction,
      });

      // skip if target season already has DateRanges
      if (targetDateRangeCount > 0) continue;

      // copy each previous DateRange to current season
      for (const prevRange of prevDateRanges) {
        const currentYear = targetSeason.operatingYear;
        const prevStartDate = normalizeToLocalDate(prevRange.startDate);
        const prevEndDate = normalizeToLocalDate(prevRange.endDate);

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
