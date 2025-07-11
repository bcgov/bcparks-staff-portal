// This script populates DateRanges for a given target year
// based on previous year's DateRanges if isDateRangeAnnual is TRUE.

import "../../env.js";

import { Season, DateRange, DateRangeAnnual } from "../../models/index.js";

// Function
function normalizeToLocalDate(dateObject) {
  if (!dateObject) return null;

  return new Date(
    dateObject.getUTCFullYear(),
    dateObject.getUTCMonth(),
    dateObject.getUTCDate(),
  );
}

export async function populateDateRangesForYear(targetYear) {
  const transaction = await DateRange.sequelize.transaction();

  try {
    // find all DateRangeAnnuals where isDateRangeAnnual is TRUE
    const annuals = await DateRangeAnnual.findAll({
      where: { isDateRangeAnnual: true },
      transaction,
    });

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

        await DateRange.create(
          {
            seasonId: targetSeason.id,
            dateTypeId: annual.dateTypeId,
            startDate: newStartDate,
            endDate: newEndDate,
          },
          { transaction },
        );
        console.log(
          `Copied DateRange from season ${prevSeason.operatingYear} to ${targetSeason.operatingYear} for publishableId=${annual.publishableId}`,
        );
      }
    }

    await transaction.commit();
    console.log(
      "DateRanges populated for new Seasons based on previous year's annual DateRanges.",
    );
  } catch (err) {
    await transaction.rollback();
    console.error("Error populating DateRanges from annual:", err);
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const targetYear = process.argv[2];

  if (!targetYear || isNaN(targetYear)) {
    console.error(
      "Please provide a target year, e.g. node populate-date-ranges.js 2026",
    );
    throw new Error("Invalid or missing target year argument.");
  }

  populateDateRangesForYear(Number(targetYear)).catch((err) => {
    console.error("Unhandled error in  populateDateRangesFromAnnual:", err);
    throw err;
  });
}
