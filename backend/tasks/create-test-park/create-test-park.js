// This script creates a new Park record in the database for development and testing purposes.
// The park will have a Feature of each FeatureType in the database, as well as a ParkArea for each FeatureType.

import "../../env.js";

import {
  Dateable,
  Feature,
  FeatureType,
  Park,
  ParkArea,
  Publishable,
} from "../../models/index.js";

// Run all queries in a transaction
const transaction = await Park.sequelize.transaction();

// for testing: roll back transaction
process.on("uncaughtException", (err) => {
  console.error(`\n${err.message}\n`);
  transaction?.rollback();
  throw err;
});

// Create new Publishable and Dateable records for the test Park
const publishable = await Publishable.create({}, { transaction });
const dateable = await Dateable.create({}, { transaction });

// Create the test Park
const park = await Park.create(
  {
    name: "Test Park",
    orcs: "9991234",
    dateableId: dateable.id,
    publishableId: publishable.id,
    strapiId: null,

    // Can't be empty: Copied from Aleza Lake Ecological Reserve
    managementAreas: [
      {
        section: {
          name: "Omineca",
          number: 3,
          strapiId: 4,
        },
        mgmtArea: {
          name: "Robson",
          number: 28,
          strapiId: 5,
        },
      },
    ],

    inReservationSystem: true,
    hasTier1Dates: true,
    hasTier2Dates: true,

    hasWinterFeeDates: true,
  },
  { transaction },
);

// Get a list of all FeatureTypes
const featureTypes = await FeatureType.findAll({ transaction });

// For each FeatureType, create:
// 1. A Park-level Feature with its own Publishable and Dateable
// 2. A ParkArea for the FeatureType with its own Publishable and Dateable
// 3. A Feature within the ParkArea with its Dateable
for (const featureType of featureTypes) {
  // Create Publishable and Dateable for the Feature
  const featurePublishable = await Publishable.create({}, { transaction });
  const featureDateable = await Dateable.create({}, { transaction });

  // 1. Create a Feature at the Park level
  await Feature.create(
    {
      name: `Test Feature - ${featureType.name}`,
      parkId: park.id,
      strapiFeatureId: null,
      featureTypeId: featureType.id,
      dateableId: featureDateable.id,
      publishableId: featurePublishable.id,
      hasReservations: true,
      parkAreaId: null,
      active: true,
      strapiId: null,
      inReservationSystem: true,
      hasBackcountryPermits: true,
      strapiOrcsFeatureNumber: null,
    },
    { transaction },
  );

  // Create Publishable and Dateable for the ParkArea
  const parkAreaPublishable = await Publishable.create({}, { transaction });
  const parkAreaDateable = await Dateable.create({}, { transaction });

  // 2. Create the ParkArea for this FeatureType
  const parkArea = await ParkArea.create(
    {
      name: `Test ParkArea - ${featureType.name}`,
      parkId: park.id,
      dateableId: parkAreaDateable.id,
      publishableId: parkAreaPublishable.id,
      active: true,
      inReservationSystem: true,
      strapiOrcsAreaNumber: null,
    },
    {
      transaction,
    },
  );

  // 3. Create 2 Features within the ParkArea
  const areaFeatureDateable1 = await Dateable.create({}, { transaction });
  const areaFeatureDateable2 = await Dateable.create({}, { transaction });

  await Feature.bulkCreate(
    [
      {
        name: `Test Area Feature 1/2 - ${featureType.name}`,
        parkId: park.id,
        strapiFeatureId: null,
        featureTypeId: featureType.id,
        dateableId: areaFeatureDateable1.id,
        publishableId: null,
        hasReservations: true,
        parkAreaId: parkArea.id,
        active: true,
        strapiId: null,
        inReservationSystem: true,
        hasBackcountryPermits: true,
        strapiOrcsFeatureNumber: null,
      },
      {
        name: `Test Area Feature 2/2 - ${featureType.name}`,
        parkId: park.id,
        strapiFeatureId: null,
        featureTypeId: featureType.id,
        dateableId: areaFeatureDateable2.id,
        publishableId: null,
        hasReservations: true,
        parkAreaId: parkArea.id,
        active: true,
        strapiId: null,
        inReservationSystem: true,
        hasBackcountryPermits: true,
        strapiOrcsFeatureNumber: null,
      },
    ],
    { transaction },
  );
}

// Commit the transaction
await transaction.commit();

console.log(`Created "Test Park" with ID ${park.id}`);
console.log(
  "Done. Now run the create-seasons script to add Seasons and DateRanges so the Test Park will appear in the Parks list.",
);
