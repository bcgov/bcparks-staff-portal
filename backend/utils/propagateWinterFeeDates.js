// For Winter fee dates collected at the Park level,
// This script will propagate the dates down to the Frontcountry camping Feature and Area levels.

import {
  Season,
  Park,
  ParkArea,
  Feature,
  FeatureType,
} from "../models/index.js";
import { APPROVED } from "../constants/seasonStatus.js";

// START: Helpers - @TODO: maybe move to a separate file

async function getSeasonFeature(season, transaction = null) {}

async function getSeasonArea(season, transaction = null) {}

async function getSeasonPark(season, transaction = null) {
  // If the season is a Park season, return it directly
  if (season.park) {
    return season;
  }

  // If the season is an Area season, get the Park details
  if (season.parkArea) {
    return await Park.findByPk(season.parkArea.parkId, { transaction });
  }

  // If the season is a Feature season, get the Park details from the Feature
  if (season.feature) {
    return await Park.findByPk(season.feature.parkId, { transaction });
  }

  throw new Error("Season does not have associated Park details.");
}

function seasonsQueryPart(operatingYear) {
  return {
    model: Season,
    as: "seasons",
    where: { operatingYear },
    required: false,
  };
}

function frontcountryFeaturesQueryPart(featureTypeId) {
  return {
    model: Feature,
    as: "features",
    where: { featureTypeId },
    required: true,
  };
}

async function getAllFrontcountrySeasons(
  park,
  operatingYear,
  transaction = null,
) {
  // Find the FeatureTypeId for "Frontcountry campground"
  const frontcountryType = await FeatureType.findOne({
    where: { name: "Frontcountry campground" },
    attributes: ["id"],
    transaction,
  });

  if (!frontcountryType) {
    throw new Error("Frontcountry campground FeatureType not found.");
  }

  const FRONTCOUNTRY_CAMPING_TYPE_ID = frontcountryType.id;

  // Get all Seasons in the Park for the operating year
  const parkSeasons = await Park.findByPk(park.id, {
    include: [
      // Park seasons
      seasonsQueryPart(operatingYear),

      // ParkAreas
      {
        model: ParkArea,
        as: "parkAreas",
        include: [
          // Frontcountry camping Features within Areas
          frontcountryFeaturesQueryPart(FRONTCOUNTRY_CAMPING_TYPE_ID),

          // Area seasons
          seasonsQueryPart(operatingYear),
        ],
      },

      // Features directly in the Park, and Features within Areas
      {
        ...frontcountryFeaturesQueryPart(FRONTCOUNTRY_CAMPING_TYPE_ID),

        include: [
          // Feature seasons
          seasonsQueryPart(operatingYear),
        ],
      },
    ],
    transaction,
  });

  // If no season satisfies the criteria, return an empty array
  if (!parkSeasons) return [];

  console.log("parkSeasons:", parkSeasons.toJSON());

  // Return all of the Seasons in one array
  return [
    ...parkSeasons.seasons,

    ...parkSeasons.parkAreas.flatMap((parkArea) => parkArea.seasons),

    ...parkSeasons.features.flatMap((feature) => feature.seasons),
  ];
}

// END: Helpers

export async function propagateWinterFeeDates(seasonId, transaction = null) {
  // Get the current Season, along with its Park details
  const season = await Season.findByPk(seasonId, {
    include: [
      // Park details, if it's a Park season
      {
        model: Park,
        as: "park",
      },

      // Area details, if it's an Area season
      {
        model: ParkArea,
        as: "parkArea",
      },

      // Feature details, if it's a Feature season (including Features within Areas)
      {
        model: Feature,
        as: "feature",
      },
    ],
    transaction,
  });

  console.log("season:");
  console.log(season.toJSON());

  // Get the Park details
  const park = await getSeasonPark(season, transaction);
  const operatingYear = season.operatingYear;

  console.log("park:");
  console.log(park.toJSON());

  console.log("operatingYear:", operatingYear);

  // If the Park doesn't have winter fee dates, return false
  if (!park.hasWinterFeeDates) return false;

  // Get all Frontcountry camping Seasons in the Park (Park/Area/Feature) for the operating year
  const allFrontcountrySeasons = await getAllFrontcountrySeasons(
    park,
    operatingYear,
    transaction,
  );

  console.log("\n\n\nallParkSeasons:", allFrontcountrySeasons.length);

  if (!allFrontcountrySeasons.length) return false;

  // Check if all of the frontcountry camping seasons are approved
  const allApproved = allFrontcountrySeasons.every(
    (frontcountrySeason) => frontcountrySeason.status === APPROVED,
  );

  console.log(allFrontcountrySeasons.map((s) => s.toJSON()));

  if (!allApproved) return false;

  console.log(
    "\n\n\n\nallApproved",
    allFrontcountrySeasons.map((s) => s.toJSON()),
  );

  return true;
}

// run it for testing
try {
  // await propagateWinterFeeDates(19533); // Park season
  // await propagateWinterFeeDates(19534); // Area season
  // await propagateWinterFeeDates(19535); // Area feature season "All sites"
  const result = await propagateWinterFeeDates(19536); // Feature season "Duncan's test"

  console.log("returned:", result);
} catch (error) {
  console.error("Error propagating winter fee dates:", error);
} finally {
  console.log("Winter fee dates propagation completed.");
}
