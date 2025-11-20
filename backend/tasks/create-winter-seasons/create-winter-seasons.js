// This script creates winter seasons for parks that have hasWinterFeeDates = true.
// It will skip creating a season if one already exists for the given operating year and publishable.
// Also removes Winter fee DateRanges from regular seasons.

import "../../env.js";

import {
  Dateable,
  DateRange,
  DateType,
  Park,
  Publishable,
  Season,
} from "../../models/index.js";
import * as STATUS from "../../constants/seasonStatus.js";

// Run all queries in a transaction
const transaction = await Season.sequelize.transaction();

if (process.env.SEQUELIZE_LOGGING === "false") {
  console.warn(
    "SEQUELIZE_LOGGING is set to false. No SQL queries will be logged.",
  );

  Season.sequelize.options.logging = false;
}

// Print errors and roll back transaction on exceptions
process.on("uncaughtException", (err) => {
  console.error(`\n${err.message}\n`);
  transaction?.rollback();
  throw new Error(err);
});

// Get the operating year from command line arguments
const operatingYear = Number(process.argv[2]);

if (isNaN(operatingYear)) {
  console.info("Usage example: npm run create-winter-seasons 2027");
  throw new Error("Missing operating year");
}

// Track the number of rows inserted/deleted
let publishablesAdded = 0;
let dateablesAdded = 0;
let winterSeasonsAdded = 0;
let winterDateRangesAdded = 0;
let winterDateRangesDeleted = 0;

/**
 * Creates a new Publishable or Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park} record The record to check and update
 * @param {string} keyName The name of the key to check ("publishableId" or "dateableId")
 * @param {any} KeyModel Db model to use for creating the new ID (Publishable or Dateable)
 * @returns {Promise<{key: number, added: boolean}>} The ID and whether it was created
 */
async function createKey(record, keyName, KeyModel) {
  if (record[keyName]) return { key: record[keyName], added: false };

  // Create the missing FK record in the function table
  const junctionKey = await KeyModel.create({}, { transaction });

  record[keyName] = junctionKey.id;
  await record.save({ transaction });
  return { key: junctionKey.id, added: true };
}

/**
 * Creates a new Publishable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park} record The record to check and update
 * @returns {Promise<number>} The record's Publishable ID
 */
async function createPublishable(record) {
  const { key, added } = await createKey(record, "publishableId", Publishable);

  if (added) publishablesAdded++;

  return key;
}

/**
 * Creates a new Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park} record The record to check and update
 * @returns {Promise<number>} The record's Dateable ID
 */
async function createDateable(record) {
  const { key, added } = await createKey(record, "dateableId", Dateable);

  if (added) dateablesAdded++;

  return key;
}

/**
 * Creates a new Winter Season for the given Publishable ID and operating year, if it doesn't already exist.
 * @param {number} publishableId The Publishable ID to check
 * @param {number} year The operating year for the season
 * @param {string} parkName The park name for logging
 * @returns {Promise<number|null>} The ID of the created Season, or existing season ID
 */
async function createWinterSeason(publishableId, year, parkName) {
  // Check if a winter season already exists for this Publishable ID and Operating Year
  const existingSeason = await Season.findOne({
    where: {
      publishableId,
      operatingYear: year,
      seasonType: "winter",
    },
    transaction,
  });

  if (existingSeason) {
    console.log(
      `Winter season already exists for ${parkName} (Publishable ${publishableId}) - ${year}`,
    );
    return existingSeason.id;
  }

  const newSeason = await Season.create(
    {
      publishableId,
      operatingYear: year,
      seasonType: "winter",
      status: STATUS.REQUESTED,
      readyToPublish: false,
    },
    { transaction },
  );

  winterSeasonsAdded++;
  console.log(
    `Created winter season for ${parkName} (Publishable ${publishableId}) - ${year}`,
  );

  return newSeason.id;
}

/**
 * Creates a DateRange for the given season and dateable with Winter fee date type.
 * @param {number} seasonId The Season ID
 * @param {number} dateableId The Dateable ID
 * @param {number} winterFeeDateTypeId The Winter fee DateType ID
 * @param {string} parkName The park name for logging
 * @returns {Promise<number|null>} The ID of the created DateRange, or existing DateRange ID
 */
async function createWinterFeeDateRange(
  seasonId,
  dateableId,
  winterFeeDateTypeId,
  parkName,
) {
  // Check if a winter fee date range already exists for this season
  const existingDateRange = await DateRange.findOne({
    where: {
      seasonId,
      dateTypeId: winterFeeDateTypeId,
    },
    transaction,
  });

  if (existingDateRange) {
    console.log(
      `Winter fee date range already exists for ${parkName} (Season ${seasonId})`,
    );
    return existingDateRange.id;
  }

  const newDateRange = await DateRange.create(
    {
      seasonId,
      dateableId,
      dateTypeId: winterFeeDateTypeId,
      startDate: null,
      endDate: null,
      adminNote: null,
    },
    { transaction },
  );

  winterDateRangesAdded++;
  console.log(
    `Created winter fee date range for ${parkName} (Season ${seasonId})`,
  );

  return newDateRange.id;
}

/**
 * Removes Winter fee DateRanges from regular seasons for the given park.
 * @param {number} publishableId The Publishable ID to check
 * @param {number} winterFeeDateTypeId The Winter fee DateType ID
 * @param {string} parkName The park name for logging
 * @returns {Promise<void>}
 */
async function removeWinterFeeFromRegularSeasons(
  publishableId,
  winterFeeDateTypeId,
  parkName,
) {
  // Find all regular seasons for this park
  const regularSeasons = await Season.findAll({
    where: {
      publishableId,
      seasonType: ["regular", null], // Include both "regular" and null (default)
    },
    transaction,
  });

  if (regularSeasons.length === 0) return;

  // Get season IDs
  const regularSeasonIds = regularSeasons.map(season => season.id);

  // Find and delete Winter fee DateRanges from regular seasons
  const winterDateRangesToDelete = await DateRange.findAll({
    where: {
      seasonId: regularSeasonIds,
      dateTypeId: winterFeeDateTypeId,
    },
    transaction,
  });

  if (winterDateRangesToDelete.length > 0) {
    // Delete the DateRanges
    const deletedCount = await DateRange.destroy({
      where: {
        seasonId: regularSeasonIds,
        dateTypeId: winterFeeDateTypeId,
      },
      transaction,
    });

    winterDateRangesDeleted += deletedCount;
    console.log(
      `Removed ${deletedCount} Winter fee date ranges from regular seasons for ${parkName}`,
    );
  }
}

console.log(`Creating Winter Seasons for ${operatingYear}`);

// Get the Winter fee DateType
const winterFeeDateType = await DateType.findOne({
  where: {
    name: "Winter fee",
  },
  transaction,
});

if (!winterFeeDateType) {
  console.error(`Winter fee DateType not found. Exiting.`);
  await transaction.rollback();
  throw new Error("Winter fee DateType not found.");
}

console.log(`Found Winter fee DateType: ${winterFeeDateType.id}`);

// Get all Parks that have winter fee dates
const parksWithWinterFees = await Park.findAll({
  attributes: [
    "id",
    "name",
    "publishableId",
    "dateableId",
    "hasWinterFeeDates",
  ],
  where: {
    hasWinterFeeDates: true,
  },
  transaction,
});

console.log(`Found ${parksWithWinterFees.length} Parks with Winter Fee Dates`);

if (parksWithWinterFees.length === 0) {
  console.log("No parks with winter fee dates found. Exiting.");
  await transaction.commit();
  throw new Error("No parks with winter fee dates found.");
}

// Process each park
const parkQueries = parksWithWinterFees.map(async (park) => {
  console.log(`Processing park: ${park.name}`);

  // Ensure the park has a publishableId
  const publishableId = await createPublishable(park);

  // Ensure the park has a dateableId
  const dateableId = await createDateable(park);

  // Remove Winter fee DateRanges from regular seasons first
  await removeWinterFeeFromRegularSeasons(
    publishableId,
    winterFeeDateType.id,
    park.name,
  );

  // Create a winter season for this park
  const winterSeasonId = await createWinterSeason(
    publishableId,
    operatingYear,
    park.name,
  );

  // Create winter fee date range for the winter season
  if (winterSeasonId) {
    await createWinterFeeDateRange(
      winterSeasonId,
      dateableId,
      winterFeeDateType.id,
      park.name,
    );
  }
});

await Promise.all(parkQueries);

console.log(`\nSummary:`);
console.log(`Added ${publishablesAdded} missing Park Publishables`);
console.log(`Added ${dateablesAdded} missing Park Dateables`);
console.log(`Added ${winterSeasonsAdded} new Winter Seasons`);
console.log(`Added ${winterDateRangesAdded} new Winter Fee DateRanges`);
console.log(`Removed ${winterDateRangesDeleted} Winter Fee DateRanges from regular seasons`);

console.log("Committing transaction...");
await transaction?.commit();
console.log("Done");
