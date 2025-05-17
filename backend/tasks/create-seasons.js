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
  Publishable,
  Season,
} from "../models/index.js";
// import { createModel } from "./utils.js";
import { Op } from "sequelize";

// Run all queries in a transaction
const transaction = await Season.sequelize.transaction();

process.on("uncaughtException", (err) => {
  console.error(`\n${err.message}\n`);
  transaction.rollback();
  throw new Error(err);
});

// Get the operating year from command line arguments
const operatingYear = process.argv[2];

if (!operatingYear) {
  console.info("Usage example: npm run create-seasons 2027");
  throw new Error("Missing operating year");
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
// Step 3: Create new seasons for every Feature that doesn't belong to a ParkArea
// Step 4: Create new seasons for the following year for every Group Camping Feature

await transaction.commit();

console.log("done");

// throw new Error("Not implemented yet");
