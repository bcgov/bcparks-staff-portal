// This script creates new blank seasons for upcoming years in the DOOT database.
// It will skip creating a season if one already exists for the given operating year and publishable.
// Also creates Group Camping seasons for the year after the operating year.

import "../env.js";

import {
  Dateable,
  Feature,
  Park,
  ParkArea,
  Publishable,
  Season,
} from "../models/index.js";

// Run all queries in a transaction
const transaction = await Season.sequelize.transaction();

process.on("uncaughtException", (err) => {
  console.error(`\n${err.message}\n`);
  transaction?.rollback();
  throw new Error(err);
});

// Get the operating year from command line arguments
let operatingYear = process.argv[2];

if (!operatingYear) {
  console.info("Usage example: npm run create-seasons 2027");
  throw new Error("Missing operating year");
}

operatingYear = Number(operatingYear);

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
    },
  ],
  transaction,
});

console.log(`Found ${parks.length} parks with features`);

let publishablesAdded = 0;
let dateablesAdded = 0;
let seasonsAdded = 0;

const parksQueries = parks.map(async (park) => {
  // If the park doesn't have a publishableId, add one and associate it
  if (!park.publishableId) {
    const publishable = await Publishable.create({}, { transaction });

    park.publishableId = publishable.id;
    await park.save({ transaction });
    publishablesAdded++;
  }

  // If the park doesn't have a dateableId, add one and associate it
  if (!park.dateableId) {
    const dateable = await Dateable.create({}, { transaction });

    park.dateableId = dateable.id;
    await park.save({ transaction });
    dateablesAdded++;
  }

  // Create a season for this park's Publishable ID and Operating Year, if it doesn't exist
  const season = await Season.findOne({
    where: {
      publishableId: park.publishableId,
      operatingYear,
    },
    transaction,
  });

  if (!season) {
    await Season.create(
      {
        publishableId: park.publishableId,
        operatingYear,
        status: "requested",
      },
      { transaction },
    );
    seasonsAdded++;
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
  if (!parkArea.publishableId) {
    const publishable = await Publishable.create({}, { transaction });

    parkArea.publishableId = publishable.id;
    await parkArea.save({ transaction });
    publishablesAdded++;
  }

  // If the parkArea doesn't have a dateableId, add one and associate it
  if (!parkArea.dateableId) {
    const dateable = await Dateable.create({}, { transaction });

    parkArea.dateableId = dateable.id;
    await parkArea.save({ transaction });
    dateablesAdded++;
  }

  // Create a season for this parkArea's Publishable ID and Operating Year, if it doesn't exist
  const season = await Season.findOne({
    where: {
      publishableId: parkArea.publishableId,
      operatingYear,
    },
    transaction,
  });

  if (!season) {
    await Season.create(
      {
        publishableId: parkArea.publishableId,
        operatingYear,
        status: "requested",
      },
      { transaction },
    );
    seasonsAdded++;
  }
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
    // Find Features with null parkAreaId
    parkAreaId: null,
  },
  transaction,
});

console.log(`Found ${features.length} features with no park area`);

const featuresQueries = features.map(async (feature) => {
  // If the feature doesn't have a publishableId, add one and associate it
  if (!feature.publishableId) {
    const publishable = await Publishable.create({}, { transaction });

    feature.publishableId = publishable.id;
    await feature.save({ transaction });
    publishablesAdded++;
  }

  // If the feature doesn't have a dateableId, add one and associate it
  if (!feature.dateableId) {
    const dateable = await Dateable.create({}, { transaction });

    feature.dateableId = dateable.id;
    await feature.save({ transaction });
    dateablesAdded++;
  }

  // Create a season for this feature's Publishable ID and Operating Year, if it doesn't exist
  const season = await Season.findOne({
    where: {
      publishableId: feature.publishableId,
      operatingYear,
    },
    transaction,
  });

  if (!season) {
    await Season.create(
      {
        publishableId: feature.publishableId,
        operatingYear,
        status: "requested",
      },
      { transaction },
    );
    seasonsAdded++;
  }
});

await Promise.all(featuresQueries);

console.log(`Added ${publishablesAdded} missing Feature Publishables`);
console.log(`Added ${dateablesAdded} missing Feature Dateables`);
console.log(`Added ${seasonsAdded} new Feature Seasons`);

// Step 4: Create new seasons for the following year for every Group Camping Feature

console.log("Committing transaction...");

await transaction?.commit();

console.log("Done");
