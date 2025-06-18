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
const WINTER_FEE_DATE_TYPE_NAME = "Winter fee";
const OPERATING_DATE_TYPE_NAME = "Operation";

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
 * @param {number} winterTypeId DB ID of the Winter fee DateType
 * @param {number} operatingTypeId DB ID of the Operation dates DateType
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array | boolean>} Array of results from bulkCreate
 * for the winter fee DateRanges, or false if no dates need to be added
 */
async function addWinterFeeDatesForSeason(
  season,
  winterDates,
  winterTypeId,
  operatingTypeId,
  transaction,
) {
  console.log("checking season:", season.toJSON());

  // If the season has any winter dates already, skip it
  const existingWinterDates = await DateRange.findAll({
    where: {
      seasonId: season.id,
      dateTypeId: winterTypeId,
    },
    transaction,
  });

  console.log("existingWinterDates:", existingWinterDates);
  if (existingWinterDates.length) {
    console.log(`Season ${season.id} already has winter dates, skipping...`);
    return false;
  }

  // Get operating dates for the season
  const operatingDatesResults = await DateRange.findAll({
    where: {
      seasonId: season.id,
      dateTypeId: operatingTypeId,
    },
    transaction,
  });

  console.log("\n\noperatingDatesResults:", operatingDatesResults);

  if (!operatingDatesResults.length) return false;

  // Group operating dates by dateableId
  const groupedOperatingDates = _.groupBy(
    operatingDatesResults,
    (dateRange) => dateRange.dateableId,
  );

  console.log("\ngroupedOperatingDates:", groupedOperatingDates);

  const creationResults = _.map(
    groupedOperatingDates,
    (dateRanges, dateableId) => {
      console.log("\n\nin map", dateableId, dateRanges);

      // Consolidate the operating date ranges for this dateableId
      const operatingDates = consolidateRanges(
        dateRanges.map((dateRange) => dateRange.toJSON()),
      );

      console.log("\n\noperatingDates:", operatingDates);

      // Get an array of overlapping dates from winterDates and operatingDates
      const overlappingDates = getOverlappingDateRanges(
        winterDates,
        operatingDates,
      );

      console.log("\n\noverlappingDates:", overlappingDates);

      if (!overlappingDates.length) return false;

      // @TODO: create winter dates for overlapping dates
      console.log("add winter date range for overlappingDates for this season");
      console.log("overlappingDates:", overlappingDates);
      return DateRange.bulkCreate(
        overlappingDates.map((dateRange) => ({
          seasonId: season.id,
          dateableId,
          dateTypeId: winterTypeId,
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

  const winterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { name: WINTER_FEE_DATE_TYPE_NAME },
    transaction,
  });

  if (!winterFeeType) {
    throw new Error("Winter fee DateType not found.");
  }

  const operatingDateType = await DateType.findOne({
    attributes: ["id"],
    where: { name: OPERATING_DATE_TYPE_NAME },
    transaction,
  });

  if (!operatingDateType) {
    throw new Error("Operating DateType not found.");
  }

  // Get all of the winter dates for the Park level
  const parkWinterDates = await DateRange.findAll({
    where: {
      dateableId: park.dateableId,
      dateTypeId: winterFeeType.id,
    },
    transaction,
  });

  console.log(
    "\n\nparkWinterDates::",
    `(id ${winterFeeType.id})`,
    parkWinterDates,
  );

  const consolidatedWinterDates = consolidateRanges(
    parkWinterDates.map((dateRange) => dateRange.toJSON()),
  );

  console.log("\n\nconsolidatedWinterDates:", consolidatedWinterDates);

  if (!consolidatedWinterDates.length) return false;

  // Find operating dates for every Area and Feature in the Park
  const addedDates = [];

  for (const season of areaAndFeatureSeasons) {
    console.log("\n\n\nloop a season here:", season.toJSON());
    const result = await addWinterFeeDatesForSeason(
      season,
      consolidatedWinterDates,
      winterFeeType.id,
      operatingDateType.id,
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
export async function propagateWinterFeeDates(seasonId, transaction = null) {
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

  const combinedFrontcountrySeasons = [
    ...allFrontcountrySeasons.park,
    ...allFrontcountrySeasons.parkArea,
    ...allFrontcountrySeasons.feature,
  ];

  console.log("\n\n\nallParkSeasons:", combinedFrontcountrySeasons.length);

  if (!combinedFrontcountrySeasons.length) return false;

  // Check if all of the frontcountry camping seasons are approved
  const allApproved = combinedFrontcountrySeasons.every(
    (frontcountrySeason) => frontcountrySeason.status === APPROVED,
  );

  console.log(combinedFrontcountrySeasons.map((s) => s.toJSON()));

  if (!allApproved) return false;

  console.log(
    "\n\n\n\nallApproved",
    combinedFrontcountrySeasons.map((s) => s.toJSON()),
  );

  // All seasons are approved, so add winter fee dates to the Feature and Area seasons
  return processAreaAndFeatureSeasons(
    allFrontcountrySeasons,
    park,
    transaction,
  );
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
