import "../../env.js";

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
  const parkSeasons = await Season.findAll(
    {
      where: { operatingYear: targetYear },

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

                  where: {
                    dateTypeId: operatingDateType.id,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    { transaction },
  );

  // Filter a list of Park Seasons that have no Operating date ranges yet
  const seasonsWithoutDates = parkSeasons.filter(
    (season) => season.park.dateable.dateRanges.length === 0,
  );

  // Build data for bulk inserting the missing Operating DateRanges
  const insertData = seasonsWithoutDates.map((season) => ({
    startDate: null,
    endDate: null,
    dateTypeId: operatingDateType.id,
    dateableId: season.park.dateable.id,
    seasonId: season.id,
    adminNote: null,
  }));

  const createdRecords = await DateRange.bulkCreate(insertData, {
    transaction,
  });

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
      throw new Error("Missing year argument");
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
