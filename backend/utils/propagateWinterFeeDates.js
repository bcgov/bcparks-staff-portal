// For Winter fee dates collected at the Park level,
// This script will propagate the dates down to the Frontcountry camping Feature and Area levels.

import _ from "lodash";

import {
  Season,
  Park,
  ParkArea,
  Feature,
  FeatureType,
  DateRange,
  DateType,
} from "../models/index.js";
import { APPROVED } from "../constants/seasonStatus.js";
import consolidateRanges from "./consolidateDateRanges.js";
import getOverlappingDateRanges from "./getOverlappingDateRanges.js";

const FRONTCOUNTRY_CAMPING_TYPE_NAME = "Frontcountry campground";
const PARK_WINTER_FEE_DATE_TYPE_NAME = "Winter fee";
const FEATURE_WINTER_FEE_DATE_TYPE_NAME = "Winter fee";
const FEATURE_OPERATING_DATE_TYPE_NAME = "Operation";

// Query part helpers
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

// Helper functions

/**
 * Returns the Park record associated with the given Season.
 * @param {Season} season Season record (could be Park, Area, or Feature Season)
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Park>} Park record for the Season
 */
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

/**
 * Gets all Frontcountry camping Seasons in the Park for the operating year.
 * This can include Park, Area, and Feature Seasons.
 * @param {Park} park The Park record to get Seasons for
 * @param {number} operatingYear The operating year to filter Seasons by
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} An object containing arrays of Seasons by level: park, parkArea, and feature.
 * @throws {Error} If the Frontcountry campground FeatureType is not found
 */
async function getAllFrontcountrySeasons(
  park,
  operatingYear,
  transaction = null,
) {
  // Find the FeatureTypeId for "Frontcountry campground"
  const frontcountryType = await FeatureType.findOne({
    where: { name: FRONTCOUNTRY_CAMPING_TYPE_NAME },
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

  // If no season satisfies the criteria, return an empty structure
  if (!parkSeasons) {
    return {
      park: [],
      parkArea: [],
      feature: [],
    };
  }

  // Return all of the Seasons, organized by level
  return {
    park: parkSeasons.seasons,

    parkArea: parkSeasons.parkAreas.flatMap((parkArea) => parkArea.seasons),

    feature: parkSeasons.features.flatMap((feature) => feature.seasons),
  };
}

/**
 * Adds winter fee dates for a given Season. Winter fee DateRanges are created
 * based on the overlapping date ranges between the provided winterDates and
 * the operating dates for any Dateables in the Season.
 * @param {Season} season Season record to add winter fee dates for
 * @param {Array} winterDates array of Winter fee DateRanges to add to the Areas and Features
 * @param {number} featureWinterTypeId DB ID of the Area/Feature-level Winter fee DateType
 * @param {number} featureOperatingTypeId DB ID of the Area/Feature-level Operation dates DateType
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array | boolean>} Array of results from bulkCreate
 * for the winter fee DateRanges, or false if no dates need to be added
 */
async function addWinterFeeDatesForSeason(
  season,
  winterDates,
  featureWinterTypeId,
  featureOperatingTypeId,
  transaction,
) {
  // If the season has any Area/Feature-level winter dates already, skip it
  const existingWinterDates = await DateRange.count({
    where: {
      seasonId: season.id,
      dateTypeId: featureWinterTypeId,
    },
    transaction,
  });

  // Skip if the season already has Area/Feature-level winter dates
  if (existingWinterDates) return false;

  // Get operating dates for the season
  const operatingDatesResults = await DateRange.findAll({
    where: {
      seasonId: season.id,
      dateTypeId: featureOperatingTypeId,
    },
    transaction,
  });

  // Skip if the season has no Operating dates
  if (!operatingDatesResults.length) return false;

  // Group operating dates by dateableId
  const groupedOperatingDates = _.groupBy(
    operatingDatesResults,
    (dateRange) => dateRange.dateableId,
  );

  const creationResults = _.map(
    groupedOperatingDates,
    (dateRanges, dateableId) => {
      // Consolidate the operating date ranges for this dateableId
      const operatingDates = consolidateRanges(
        dateRanges.map((dateRange) => dateRange.toJSON()),
      );

      // Get an array of overlapping dates from winterDates and operatingDates
      const overlappingDates = getOverlappingDateRanges(
        winterDates,
        operatingDates,
      );

      // Skip creating winter dates if there are no overlapping dates
      if (!overlappingDates.length) return false;

      // Create winter fee DateRanges for the overlapping dates for this dateableId
      return DateRange.bulkCreate(
        overlappingDates.map((dateRange) => ({
          seasonId: season.id,
          dateableId,
          dateTypeId: featureWinterTypeId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })),
        { transaction },
      );
    },
  );

  return Promise.all(creationResults);
}

/**
 * Processes the Area and Feature Seasons to add winter fee dates, if applicable.
 * @param {Object} allSeasons object containing seasons organized by level (from `getAllFrontcountrySeasons`)
 * @param {Park} park Park record for the Seasons
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Array of query results from calling `addWinterFeeDatesForSeason` for each Season
 * @throws {Error} If the Winter fee DateType or Operating DateType is not found
 */
async function processAreaAndFeatureSeasons(
  allSeasons,
  park,
  transaction = null,
) {
  const areaAndFeatureSeasons = [...allSeasons.parkArea, ...allSeasons.feature];

  // Get the IDs for the DateTypes we need in the queries

  // Park-level winter fees
  const parkLevelWinterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { name: PARK_WINTER_FEE_DATE_TYPE_NAME, parkLevel: true },
    transaction,
  });

  // Throw an error if the DateType isn't in the DB
  if (!parkLevelWinterFeeType) {
    throw new Error("Park-level Winter fee DateType not found.");
  }

  // Area/Feature-level winter fees
  const featureLevelWinterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { name: FEATURE_WINTER_FEE_DATE_TYPE_NAME, featureLevel: true },
    transaction,
  });

  if (!featureLevelWinterFeeType) {
    throw new Error("Feature-level Winter fee DateType not found.");
  }

  // Area/Feature-level operating dates
  const featureLevelOperatingType = await DateType.findOne({
    attributes: ["id"],
    where: { name: FEATURE_OPERATING_DATE_TYPE_NAME, featureLevel: true },
    transaction,
  });

  if (!featureLevelOperatingType) {
    throw new Error("Operating DateType not found.");
  }

  // Get all of the winter dates for the Park level
  const parkWinterDates = await DateRange.findAll({
    where: {
      dateableId: park.dateableId,
      dateTypeId: parkLevelWinterFeeType.id,
    },
    transaction,
  });

  // Consolidate Winter fee dates (sort & remove duplicates)
  const consolidatedWinterDates = consolidateRanges(
    parkWinterDates.map((dateRange) => dateRange.toJSON()),
  );

  if (!consolidatedWinterDates.length) return false;

  // Loop through each Area and Feature Season and add winter fee dates
  const addedDates = [];

  for (const season of areaAndFeatureSeasons) {
    const result = await addWinterFeeDatesForSeason(
      season,
      consolidatedWinterDates,
      featureLevelWinterFeeType.id,
      featureLevelOperatingType.id,
      transaction,
    );

    addedDates.push(result);
  }

  return addedDates;
}

/**
 * Propagates winter fee dates from the Park level down to Area and Feature Seasons.
 * This happens if the park supports winter fee dates and all Frontcountry camping Seasons are approved.
 * @param {number} seasonId The ID of the Season being approved
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean | Array>} Returns false if no winter fee dates are added,
 */
export default async function propagateWinterFeeDates(
  seasonId,
  transaction = null,
) {
  // Get details for the provided Season that was just approved, along with its Park details
  // We'll use it to check all the other seasons for the Park and operatingYear
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

  // Get the Park details
  const park = await getSeasonPark(season, transaction);
  const operatingYear = season.operatingYear;

  // If the Park doesn't have winter fee dates, return false
  if (!park.hasWinterFeeDates) return false;

  // Get all Frontcountry camping Seasons in the Park (Park/Area/Feature) for the operating year
  const allFrontcountrySeasons = await getAllFrontcountrySeasons(
    park,
    operatingYear,
    transaction,
  );

  const combinedFrontcountrySeasons = [
    ...allFrontcountrySeasons.park,
    ...allFrontcountrySeasons.parkArea,
    ...allFrontcountrySeasons.feature,
  ];

  // If no Frontcountry camping Seasons are found, there's nothing to do, so return false
  if (!combinedFrontcountrySeasons.length) return false;

  // Check if all of the frontcountry camping seasons are approved
  const allApproved = combinedFrontcountrySeasons.every(
    (frontcountrySeason) => frontcountrySeason.status === APPROVED,
  );

  // If any of the seasons are still unapproved, return false
  // Winter fee dates should only be propagated when all seasons are approved
  if (!allApproved) return false;

  // All seasons are approved, so add winter fee dates to the Feature and Area seasons
  return processAreaAndFeatureSeasons(
    allFrontcountrySeasons,
    park,
    transaction,
  );
}
