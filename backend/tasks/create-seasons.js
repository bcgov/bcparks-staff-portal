// This script creates new blank seasons for upcoming years in the DOOT database.
// It will skip creating a season if one already exists for the given operating year and publishable.
// Also creates Group Camping seasons for the year after the operating year.

import "../env.js";

import {
  Dateable,
  DateRange,
  DateType,
  Feature,
  FeatureType,
  Park,
  ParkArea,
  Publishable,
  Season,
} from "../models/index.js";
import * as STATUS from "../constants/seasonStatus.js";
import { populateAnnualDateRangesForYear } from "./populate-date-ranges/populate-annual-date-ranges.js";
import { populateBlankDateRangesForYear } from "./populate-date-ranges/populate-blank-date-ranges.js";

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
  console.info("Usage example: npm run create-seasons 2027");
  throw new Error("Missing operating year");
}

// Track the number of rows inserted
let publishablesAdded = 0;
let dateablesAdded = 0;
let seasonsAdded = 0;

/**
 * Creates a new Publishable or Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {string} keyName The name of the key to check ("publishableId" or "dateableId")
 * @param {any} KeyModel Db model to use for creating the new ID (Publishable or Dateable)
 * @returns {Promise<number>} The ID of the record's Publishable/Dateable
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
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @returns {Promise<number>} The record's Publishable ID
 */
async function createPublishable(record) {
  const { key, added } = await createKey(record, "publishableId", Publishable);

  if (added) publishablesAdded++;

  return key;
}

/**
 * Creates a new Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @returns {Promise<number>} The record's Dateable ID
 */
async function createDateable(record) {
  const { key, added } = await createKey(record, "dateableId", Dateable);

  if (added) dateablesAdded++;

  return key;
}

/**
 * Creates a new Season for the given Publishable ID and operating year, if it doesn't already exist.
 * @param {number} publishableId The Publishable ID to check
 * @param {number} year The operating year for the season
 * @returns {Promise<number>} The ID of the created or existing Season
 */
async function createSeason(publishableId, year) {
  // Create a season for this Publishable ID and Operating Year, if it doesn't exist
  const season = await Season.findOne({
    where: {
      publishableId,
      operatingYear: year,
    },

    transaction,
  });

  if (season) return season.id;

  const newSeason = await Season.create(
    {
      publishableId,
      operatingYear: year,
      status: STATUS.REQUESTED,
    },

    { transaction },
  );

  seasonsAdded++;
  return newSeason.id;
}

/**
 * Creates blank Tier 2 dates for the given park if it had Tier 2 dates in the previous year.
 * @param {number} dateableId The Park's Dateable ID for the new Season
 * @param {number} seasonId The ID of the Park's new Season
 * @param {Park} park Park record to check and create dates for
 * @param {number} year The operating year for the current season
 * @param {number} tier2DateTypeId The ID of the Tier 2 date type
 * @returns {Promise<DateRange[]>} Returns a Promise that resolves to an array of created DateRanges
 */
async function createTier2Dates(
  dateableId,
  seasonId,
  park,
  year,
  tier2DateTypeId,
) {
  if (!park.hasTier2Dates) return [];

  // If the Park had Tier 2 dates in the previous year,
  // create the same number of blank Tier 2 dates for the new season

  // If any Date Ranges already exist for this season, skip creating new ones
  const existingRanges = await DateRange.findAll({
    where: {
      seasonId,
      dateTypeId: tier2DateTypeId,
    },
    transaction,
  });

  if (existingRanges.length > 0) {
    console.log(
      `Found ${existingRanges.length} existing Date Ranges for Season ${seasonId}: ` +
        `Skipping creation of new Tier 2 dates for ${park.name}.`,
    );
    return [];
  }

  // Check if the park's Dateable ID has any Tier 2 dates in the previous year
  const previousYear = year - 1;
  const previousParkSeasons = await Season.findAll({
    where: {
      publishableId: park.publishableId,
      operatingYear: previousYear,
    },

    include: [
      {
        model: DateRange,
        as: "dateRanges",
        required: true,
        where: { dateTypeId: tier2DateTypeId },
      },
    ],

    transaction,
  });

  // Create DateRange records for each Season's Tier 2 dates
  let numCreated = 0;
  const insertQueries = previousParkSeasons.map(async (oldSeason) => {
    if (!oldSeason.dateRanges.length) return null;

    // Create a new blank DateRange for each Tier 2 date in the old season
    const createData = oldSeason.dateRanges.map(() => ({
      seasonId,
      dateableId,
      dateTypeId: tier2DateTypeId,
      startDate: null,
      endDate: null,
      adminNote: null,
    }));

    // Create the DateRange records in bulk
    numCreated += createData.length;
    return DateRange.bulkCreate(createData, { transaction });
  });

  const allDone = await Promise.all(insertQueries);

  console.log(
    `Created ${numCreated} blank Tier 2 dates for park ${park.name} (Publishable ${park.publishableId})`,
  );

  return allDone;
}

console.log(`Creating Seasons for ${operatingYear}`);

// Step 1: Create new Seasons for every Park

// Get all the Parks with Features
const parks = await Park.findAll({
  attributes: ["id", "name", "publishableId", "dateableId", "hasTier2Dates"],
  include: [
    {
      model: Feature,
      as: "features",
      required: true,
      where: {
        active: true,
      },
    },
  ],
  transaction,
});

console.log(`Found ${parks.length} Parks with Features`);

// Get the Tier 2 DateType
const tier2DateType = await DateType.findOne({
  where: {
    name: "Tier 2",
  },
  transaction,
});

if (!tier2DateType) {
  console.warn(`Tier 2 DateType not found. Skipping Tier 2 dates creation.`);
}

const parksQueries = parks.map(async (park) => {
  // If the park doesn't have a publishableId, add one and associate it
  await createPublishable(park);

  // If the park doesn't have a dateableId, add one and associate it
  const dateableId = await createDateable(park);

  // Create a season for this park's Publishable ID and Operating Year, if it doesn't exist
  const seasonId = await createSeason(park.publishableId, operatingYear);

  if (tier2DateType) {
    // Create blank Tier 2 dates for the park, if applicable
    await createTier2Dates(
      dateableId,
      seasonId,
      park,
      operatingYear,
      tier2DateType.id,
    );
  }
});

await Promise.all(parksQueries);

console.log(`Added ${publishablesAdded} missing Park Publishables`);
console.log(`Added ${dateablesAdded} missing Park Dateables`);
console.log(`Added ${seasonsAdded} new Park Seasons`);

// Step 2: Create new seasons for every ParkArea with Features in it

publishablesAdded = 0;
dateablesAdded = 0;
seasonsAdded = 0;

const parkAreaFeatures = await Feature.findAll({
  where: {
    active: true,
  },

  include: [
    {
      model: ParkArea,
      as: "parkArea",
      required: true,
      attributes: ["id", "name", "publishableId", "dateableId"],
    },
  ],

  transaction,
});

// Get all the ParkAreas with Features
const parkAreasMap = new Map(
  parkAreaFeatures.map((feature) => [feature.parkArea.id, feature.parkArea]),
);
const parkAreasWithFeatures = Array.from(parkAreasMap.values());

console.log(`Found ${parkAreasWithFeatures.length} ParkAreas with Features`);

/**
 * Creates new Seasons for each ParkArea in the provided array for the given year.
 * @param {Array<ParkArea>} parkAreas Array of ParkArea records to process.
 * @param {number} year The operating year for which to create seasons.
 * @returns {Promise<void>}
 */
async function createSeasonsForParkAreas(parkAreas, year) {
  for (const parkArea of parkAreas) {
    // If the parkArea doesn't have a publishableId, add one and associate it
    await createPublishable(parkArea);

    // If the parkArea doesn't have a dateableId, add one and associate it
    await createDateable(parkArea);

    // Create a season for this parkArea's Publishable ID and Operating Year, if it doesn't exist
    await createSeason(parkArea.publishableId, year);
  }
}

await createSeasonsForParkAreas(parkAreasWithFeatures, operatingYear);

console.log(`Added ${publishablesAdded} missing ParkArea Publishables`);
console.log(`Added ${dateablesAdded} missing ParkArea Dateables`);
console.log(`Added ${seasonsAdded} new ParkArea Seasons`);

// Step 3: Create new seasons for every Feature that doesn't belong to a ParkArea

publishablesAdded = 0;
dateablesAdded = 0;
seasonsAdded = 0;

const featuresWithoutParkArea = await Feature.findAll({
  where: {
    active: true,
    // Find Features with null parkAreaId
    parkAreaId: null,
  },

  transaction,
});

console.log(
  `Found ${featuresWithoutParkArea.length} Features with no ParkArea`,
);

/**
 * Creates new Seasons for each Feature in the provided array for the given year.
 * @param {Array<Feature>} features Array of Feature records to process.
 * @param {number} year The operating year for which to create seasons.
 * @returns {Promise<void>}
 */
async function createSeasonsForFeatures(features, year) {
  for (const feature of features) {
    // If the feature doesn't have a publishableId, add one and associate it
    await createPublishable(feature);

    // If the feature doesn't have a dateableId, add one and associate it
    await createDateable(feature);

    // Create a season for this feature's Publishable ID and Operating Year, if it doesn't exist
    await createSeason(feature.publishableId, year);
  }
}

await createSeasonsForFeatures(featuresWithoutParkArea, operatingYear);

console.log(`Added ${publishablesAdded} missing Feature Publishables`);
console.log(`Added ${dateablesAdded} missing Feature Dateables`);
console.log(`Added ${seasonsAdded} new Feature Seasons`);

// Step 4: Create new seasons for the following year for every Group Camping Feature
const nextYear = operatingYear + 1;

console.log(`Creating Group Camping seasons for ${nextYear}`);

publishablesAdded = 0;
dateablesAdded = 0;
seasonsAdded = 0;

const groupCampingFeatures = await Feature.findAll({
  where: {
    active: true,
  },

  include: {
    model: FeatureType,
    as: "featureType",
    required: true,

    where: {
      name: "Group campground",
    },
  },

  transaction,
});

console.log(`Found ${groupCampingFeatures.length} Group Camping Features`);

// Collect unique parkAreaIds from group camping features that belong to a ParkArea
const uniqueParkAreaIds = [
  ...new Set(
    groupCampingFeatures
      .filter((feature) => feature.parkAreaId)
      .map((feature) => feature.parkAreaId),
  ),
];

const groupCampingParkAreas = await ParkArea.findAll({
  where: { id: uniqueParkAreaIds },
  transaction,
});

// Create seasons for each unique ParkArea
await createSeasonsForParkAreas(groupCampingParkAreas, nextYear);

// For group camping features that do NOT belong to a ParkArea, create seasons for the feature itself
const independentFeatures = groupCampingFeatures.filter(
  (feature) => !feature.parkAreaId,
);

await createSeasonsForFeatures(independentFeatures, nextYear);

console.log(
  `Added ${publishablesAdded} missing Group Camping Feature Publishables`,
);
console.log(`Added ${dateablesAdded} missing Group Camping Feature Dateables`);
console.log(`Added ${seasonsAdded} new Group Camping Feature Seasons`);

// Populate DateRanges for the new seasons based on previous year if isDateRangeAnnual is TRUE
await populateAnnualDateRangesForYear(operatingYear, transaction);

// Populate blank DateRanges for the new seasons
await populateBlankDateRangesForYear(operatingYear, transaction);

// Populate blank DateRanges for the next year (which was just created for Group Camping)
await populateBlankDateRangesForYear(nextYear, transaction);

console.log("Committing transaction...");

await transaction?.commit();

console.log("Done");
