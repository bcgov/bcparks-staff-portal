import "../../env.js";

import { Sequelize } from "sequelize";
import {
  DateType,
  DateRange,
  GateDetail,
  Park,
  Season,
  Dateable,
} from "../../models/index.js";

/**
 * Populates blank Park Operating DateRanges for a given year by creating DateRanges for all
 * Park-level Seasons where the Park has Gate Details with "hasGate=TRUE"
 * @param {number} targetYear The year for which to populate blank DateRanges
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Array of created DateRange records
 */
export default async function populateBlankGateOperatingDates(
  targetYear,
  transaction = null,
) {
  // Get the Park "Operating" datetype
  const operatingDateType = await DateType.findOne({
    attributes: ["id"],

    where: {
      name: "Operating",
    },

    transaction,
  });

  // Get all Park Seasons with "HasGate = true"
  const parkSeasons = await Season.findAll({
    where: { operatingYear: targetYear },

    include: [
      {
        model: Park,
        as: "park",
        attributes: ["id", "name", "publishableId"],
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
                where: {
                  seasonId: {
                    [Sequelize.Op.col]: "Season.id",
                  },
                },
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

  // Filter for seasons that have no Operating DateRanges
  const seasonsWithoutOperatingDates = parkSeasons.filter((season) => {
    const operatingDateRanges = season.park.dateable.dateRanges.filter(
      (dateRange) => dateRange.dateTypeId === operatingDateType.id,
    );

    return operatingDateRanges.length === 0;
  });

  console.log(
    `\n${seasonsWithoutOperatingDates.length} seasons need Operating DateRanges created`,
  );

  if (seasonsWithoutOperatingDates.length === 0) {
    console.log(
      "No DateRanges to create - all parks already have Operating dates",
    );
    return [];
  }

  // Build data for bulk inserting the missing Operating DateRanges
  const insertData = seasonsWithoutOperatingDates.map((season) => ({
    startDate: null,
    endDate: null,
    dateTypeId: operatingDateType.id,
    dateableId: season.park.dateable.id,
    seasonId: season.id,
    adminNote: null,
  }));

  console.log(`\nCreating ${insertData.length} Operating DateRanges...`);

  const createdRecords = await DateRange.bulkCreate(insertData, {
    transaction,
  });

  console.log(
    `Successfully created ${createdRecords.length} Operating DateRanges`,
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
