// This script creates new blank seasons for upcoming years in the DOOT database.
// It will skip creating a season if one already exists for the given operating year and publishable.
// Also creates Group Camping seasons for the year after the operating year.

import "../env.js";

import {
  Dateable,
  Feature,
  FeatureType,
  Park,
  ParkArea,
  Publishable,
  Season,
} from "../models/index.js";

// Run all queries in a transaction
const transaction = await Season.sequelize.transaction();

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
      status: "requested",
    },

    { transaction },
  );

  seasonsAdded++;
  return newSeason.id;
}

console.log(`Creating seasons for ${operatingYear}`);

// Step 1: Create new seasons for every Park

// Get all the Parks with Features
const parks = await Park.findAll({
  attributes: ["id", "name", "publishableId", "dateableId"],
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

console.log(`Found ${parks.length} parks with features`);

const parksQueries = parks.map(async (park) => {
  // If the park doesn't have a publishableId, add one and associate it
  await createPublishable(park);

  // If the park doesn't have a dateableId, add one and associate it
  await createDateable(park);

  // Create a season for this park's Publishable ID and Operating Year, if it doesn't exist
  await createSeason(park.publishableId, operatingYear);
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
const parkAreas = Array.from(parkAreasMap.values());

console.log(`Found ${parkAreas.length} park areas with features`);

const parkAreasQueries = parkAreas.map(async (parkArea) => {
  // If the parkArea doesn't have a publishableId, add one and associate it
  await createPublishable(parkArea);

  // If the parkArea doesn't have a dateableId, add one and associate it
  await createDateable(parkArea);

  // Create a season for this parkArea's Publishable ID and Operating Year, if it doesn't exist
  await createSeason(parkArea.publishableId, operatingYear);
});

await Promise.all(parkAreasQueries);

console.log(`Added ${publishablesAdded} missing ParkArea Publishables`);
console.log(`Added ${dateablesAdded} missing ParkArea Dateables`);
console.log(`Added ${seasonsAdded} new ParkArea Seasons`);

// Step 3: Create new seasons for every Feature that doesn't belong to a ParkArea

publishablesAdded = 0;
dateablesAdded = 0;
seasonsAdded = 0;

const features = await Feature.findAll({
  where: {
    active: true,
    // Find Features with null parkAreaId
    parkAreaId: null,
  },

  transaction,
});

console.log(`Found ${features.length} features with no park area`);

const featuresQueries = features.map(async (feature) => {
  // If the feature doesn't have a publishableId, add one and associate it
  await createPublishable(feature);

  // If the feature doesn't have a dateableId, add one and associate it
  await createDateable(feature);

  // Create a season for this feature's Publishable ID and Operating Year, if it doesn't exist
  await createSeason(feature.publishableId, operatingYear);
});

await Promise.all(featuresQueries);

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

console.log(`Found ${groupCampingFeatures.length} Group Camping features`);

const groupCampingQueries = groupCampingFeatures.map(async (feature) => {
  // If the feature doesn't have a publishableId, add one and associate it
  await createPublishable(feature);

  // If the feature doesn't have a dateableId, add one and associate it
  await createDateable(feature);

  // Create a season for this Feature's Publishable ID and next Operating Year, if it doesn't exist
  await createSeason(feature.publishableId, nextYear);
});

await Promise.all(groupCampingQueries);

console.log(
  `Added ${publishablesAdded} missing Group Camping Feature Publishables`,
);
console.log(`Added ${dateablesAdded} missing Group Camping Feature Dateables`);
console.log(`Added ${seasonsAdded} new Group Camping Feature Seasons`);

console.log("Committing transaction...");

await transaction?.commit();

console.log("Done");
