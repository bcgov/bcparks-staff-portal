import "../../env.js";
import { Op, fn, col, literal } from "sequelize";
import { DateRange, Season, Feature, ParkArea } from "../../models/index.js";

const counts = {
  updated: 0,
  skipped: 0,
};

/**
 * Deletes any existing DateRanges from targetSeason and moves DateRanges
 * from currentSeason to targetSeason.
 * @param {*} currentSeason
 * @param {*} targetSeason
 * @param {*} transaction
 * @returns
 */
async function moveDateRanges(currentSeason, targetSeason, transaction) {
  // if the targetSeason has valid DateRanges then skip
  if (targetSeason.dateRanges.length > 0) {
    console.log(
      `Skipping seasonId ${targetSeason.id} as it already has valid DateRanges`,
    );
    counts.skipped++;
    return;
  }

  // Delete any DateRanges currently associated with the targetSeason
  // (the check above was using a filtered list, but there may be incomplete DateRanges)
  await DateRange.destroy({
    where: {
      seasonId: targetSeason.id,
    },
    transaction,
  });

  // Update currentSeason DateRanges to point to the targetSeason
  await DateRange.update(
    { seasonId: targetSeason.id },
    {
      where: {
        seasonId: currentSeason.id,
      },
      transaction,
    },
  );

  counts.updated++;
}

/**
 * Finds and fixes orphaned DateRanges for the given operating year. DateRanges
 * are considered orphaned if they are associated with Seasons that belong to
 * different publishables for the same dateableId. This can happen when Features
 * are moved in and out of ParkAreas over time. In such cases, the DateRanges
 * should be associated with the Season that matches the current relationship.
 * Only one year of data is processed at a time to limit the scope of changes.
 * Other issues may also be logged, but it only fixes this specific type of issue.
 * @param {number} operatingYear
 * @param {*} transaction
 */
export default async function fixOrphanedDateRanges(
  operatingYear,
  transaction = null,
) {
  if (isNaN(operatingYear)) {
    console.info(
      "Usage example: node tasks/fix-orphaned-dateranges/fix-orphaned-dateranges.js 2027",
    );
    throw new Error("Missing operating year");
  }

  // Find dateableIds that are associated with multiple publishableIds
  // in the same operating year. This is an indication of potential orphaned
  // DateRanges due to changes in Feature/ParkArea relations over time.
  const results = await Season.findAll({
    attributes: [
      [col("dateRanges.dateableId"), "dateableId"],
      ["seasonType", "seasonType"],
      [fn("ARRAY_AGG", fn("DISTINCT", col("Season.id"))), "seasonIds"],
      [fn("COUNT", fn("DISTINCT", col("Season.publishableId"))), "seasonCount"],
    ],
    include: [
      {
        model: DateRange,
        as: "dateRanges",
        attributes: [], // We only need dateableId for grouping
        required: true,
      },
    ],
    where: { operatingYear },
    group: [col("dateRanges.dateableId"), col("Season.seasonType")],
    having: literal('COUNT(DISTINCT "Season"."publishableId") > 1'), // this hasn't been tested with more than 2 publishables
    raw: true,
    transaction,
  });

  console.log(
    `Found ${results.length} dateableIds with DateRanges for multiple publishableIds for operatingYear ${operatingYear}`,
  );

  // Next we want to get the Seasons, Features and ParkAreas associated
  // with each seasonId and add them to the results
  for (const row of results) {
    const { dateableId, seasonIds } = row;

    row.seasons = await Season.findAll({
      where: { id: seasonIds },
      attributes: ["id"],
      include: [
        {
          // If the Feature is not null then the Season is associated with a Feature
          model: Feature,
          as: "feature",
          attributes: ["id"],
          required: false,
        },
        {
          // If the ParkArea is not null then the Season is associated with a ParkArea
          model: ParkArea,
          as: "parkArea",
          attributes: ["id"],
          required: false,
        },
        {
          // Get a list of DateRange for the Season that have non-null start and end dates.
          // We will use this to determine if the Season has valid DateRanges.
          model: DateRange,
          as: "dateRanges",
          attributes: ["id"],
          where: {
            startDate: { [Op.ne]: null },
            endDate: { [Op.ne]: null },
          },
          required: false,
        },
      ],
      transaction,
    });

    // We no longer need the seasonIds array
    delete row.seasonIds;

    // Get the Feature for this dateableId. If it has a parkAreaId then the
    // dateableId belongs to a Feature within a ParkArea. Otherwise it is a
    // standalone Feature.
    row.feature = await Feature.findOne({
      where: { dateableId },
      attributes: ["id", "parkAreaId"],
      transaction,
    });

    // Get the ParkArea for this dateableId, if it exists
    row.parkArea = await ParkArea.findOne({
      where: { dateableId },
      attributes: ["id"],
      transaction,
    });
  }

  // Now we can analyze the results and determine which DateRanges need to be fixed
  for (const row of results) {
    const { seasons, feature, parkArea } = row;

    // Standalone Feature -- find the Season the is associated with a Feature
    const featureSeason = seasons.find((s) => s.feature !== null);
    const parkAreaSeason = seasons.find((s) => s.parkArea !== null);

    // the code below assumes there is both a parkAreaSeason and featureSeason.
    // If either is missing then skip to the next entry. This script is only intended
    // to fix orphaned DateRanges as a result of ParkAreas being assigned to standalone
    // Features and vice versa.
    if (!parkAreaSeason || !featureSeason) {
      console.log(
        `Skipping dateableId ${row.dateableId} as it does not have both a ParkArea season and a Feature season`,
      );
      counts.skipped++;
      continue;
    }

    if (row.seasonCount > 2) {
      console.log(
        `Skipping dateableId ${row.dateableId} as it is associated with more than 2 publishables and must be reviewed manually`,
      );
      counts.skipped++;
      continue;
    }

    if (parkArea) {
      console.log(
        `Skipping dateableId ${row.dateableId} as it belongs to a ParkArea, not a Feature`,
      );
      counts.skipped++;
      continue;
    }

    if (!feature.parkAreaId) {
      // Standalone Feature
      await moveDateRanges(parkAreaSeason, featureSeason, transaction, counts);
    } else {
      // Feature within a ParkArea
      await moveDateRanges(featureSeason, parkAreaSeason, transaction);
    }
  }

  console.log(
    `Fixed ${counts.updated} orphaned DateRanges for operatingYear ${operatingYear}`,
  );
  console.log(
    `Skipped ${counts.skipped} DateRanges for operatingYear ${operatingYear}`,
  );
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const operatingYear = Number(process.argv[2]);

  const transaction = await Season.sequelize.transaction();

  try {
    await fixOrphanedDateRanges(operatingYear, transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Failed to fix orphaned date ranges:", err);
    throw err;
  }
}
