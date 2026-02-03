import "../../env.js";

import {
  DateType,
  DateRange,
  GateDetail,
  Park,
  Season,
  Dateable,
} from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";

/**
 * Populates blank Park gate open DateRanges for a given year by creating DateRanges for all
 * Park-level Seasons where the Park has Gate Details with "hasGate=TRUE"
 * @param {number} targetYear The year for which to populate blank DateRanges
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Array of created DateRange records
 */
export default async function populateBlankGateOperatingDates(
  targetYear,
  transaction = null,
) {
  // Get the Park "Park gate open" datetype
  const gateDateType = await DateType.findOne({
    attributes: ["id"],

    where: {
      strapiDateTypeId: DATE_TYPE.PARK_GATE_OPEN,
    },

    transaction,
  });

  // Get all Park Seasons with "HasGate = true" and "seasonType = regular"
  const parkSeasons = await Season.findAll({
    where: {
      operatingYear: targetYear,
      seasonType: SEASON_TYPE.REGULAR,
    },

    include: [
      {
        model: Park,
        as: "park",
        attributes: ["id", "name"],
        required: true,

        include: [
          {
            model: GateDetail,
            as: "gateDetails",
            required: true,
            where: {
              hasGate: true,
            },
          },

          {
            model: Dateable,
            as: "dateable",
            required: true,

            include: [
              {
                model: DateRange,
                as: "dateRanges",
                required: false,
              },
            ],
          },
        ],
      },
    ],

    transaction,
  });

  console.log(
    `\nFound ${parkSeasons.length} park seasons with gates for year ${targetYear}`,
  );

  // Filter for seasons that have no Park gate open DateRanges for this specific season
  const seasonsWithoutGateDates = parkSeasons.filter((season) => {
    const gateDateRanges = season.park.dateable.dateRanges.filter(
      (dateRange) =>
        dateRange.dateTypeId === gateDateType.id &&
        dateRange.seasonId === season.id,
    );

    return gateDateRanges.length === 0;
  });

  console.log(
    `\n${seasonsWithoutGateDates.length} seasons need Park gate open DateRanges created`,
  );

  if (seasonsWithoutGateDates.length === 0) {
    console.log(
      "No DateRanges to create - all parks already have Park gate open dates",
    );
    return [];
  }

  // Build data for bulk inserting the missing Park gate open DateRanges
  const insertData = seasonsWithoutGateDates.map((season) => ({
    startDate: null,
    endDate: null,
    dateTypeId: gateDateType.id,
    dateableId: season.park.dateable.id,
    seasonId: season.id,
  }));

  console.log(`\nCreating ${insertData.length} Park gate open DateRanges...`);

  const createdRecords = await DateRange.bulkCreate(insertData, {
    transaction,
  });

  console.log(
    `Successfully created ${createdRecords.length} Park gate open DateRanges`,
  );

  return createdRecords;
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const targetYear = process.argv[2];
  // Run all queries in a transaction
  const transaction = await Season.sequelize.transaction();

  try {
    if (!targetYear || isNaN(targetYear)) {
      console.info("Usage example: node populate-blank-gate-dates.js 2097");
      throw new Error("Missing or invalid year argument");
    }

    const createdRecords = await populateBlankGateOperatingDates(
      Number(targetYear),
      transaction,
    );

    await transaction.commit();
    console.log(
      "Done creating blank Operating DateRanges for year",
      targetYear,
    );
    console.log(`Created ${createdRecords.length} records`);
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
