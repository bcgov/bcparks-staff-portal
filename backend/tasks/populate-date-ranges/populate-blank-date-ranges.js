// This script populates blank DateRanges for a given target year
// in order to show blank date picker inputs on the frontend
import "../../env.js";

import _ from "lodash";
import { Op } from "sequelize";
import populateBlankGateOperatingDates from "./populate-blank-gate-dates.js";

import {
  DateRange,
  Feature,
  Park,
  ParkArea,
  Season,
} from "../../models/index.js";
import {
  getAllDateTypes,
  getDateTypesForFeature,
  getDateTypesForPark,
} from "../../utils/dateTypesHelpers.js";

// Select the relevant attributes for Feature records
const FEATURE_ATTRIBUTES = [
  "id",
  "dateableId",
  "publishableId",
  "hasReservations",
  "hasBackcountryPermits",
];

/**
 * Returns a comparison key for a DateRange based on its season, dateable, and date type IDs.
 * @param {number} seasonId season ID from the DB
 * @param {number} dateableId dateable ID from the DB
 * @param {number} dateTypeId date type ID from the DB
 * @returns {string} Unique key for the DateRange
 */
function getDateRangeKey(seasonId, dateableId, dateTypeId) {
  return `${seasonId}-${dateableId}-${dateTypeId}`;
}

/**
 * Populates blank DateRanges for a given year by creating DateRanges for all Seasons
 * and their associated Dateable Parks and Features, and applicable DateTypes.
 * @param {number} targetYear The year for which to populate blank DateRanges
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Array of created DateRange records
 */
export async function populateBlankDateRangesForYear(
  targetYear,
  transaction = null,
) {
  try {
    console.log(`Creating blank DateRanges for ${targetYear}`);

    // Find all Seasons for the target year
    const seasons = await Season.findAll({
      where: { operatingYear: targetYear },

      include: [
        {
          model: Park,
          as: "park",
          attributes: [
            "id",
            "dateableId",
            "publishableId",
            "hasTier1Dates",
            "hasTier2Dates",
            "hasWinterFeeDates",
          ],
        },

        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id", "dateableId", "publishableId"],

          include: [
            {
              model: Feature,
              as: "features",
              attributes: FEATURE_ATTRIBUTES,
            },
          ],
        },

        {
          model: Feature,
          as: "feature",
          attributes: FEATURE_ATTRIBUTES,
        },
      ],

      transaction,
    });

    console.log(`Found ${seasons.length} Seasons for ${targetYear}`);

    // Get all date types for all levels of dateables
    const allDateTypes = await getAllDateTypes({}, transaction);

    // Group date types by their applicable levels
    // (Dates aren't collected for ParkArea Dateables: only Parks and Features)
    const parkDateTypes = [];
    const featureDateTypes = [];

    allDateTypes.forEach((dateType) => {
      // If the date type is applicable to Parks, add it to parkDateTypes
      if (dateType.parkLevel) {
        parkDateTypes.push({ id: dateType.id, name: dateType.name });
      }

      // If the date type is applicable to Features, add it to featureDateTypes
      if (dateType.featureLevel) {
        featureDateTypes.push({ id: dateType.id, name: dateType.name });
      }
    });

    const parkDateTypesByName = _.keyBy(parkDateTypes, "name");
    const featureDateTypesByName = _.keyBy(featureDateTypes, "name");

    // Create a list of seasonId+dateableId+dateTypeId combinations
    // for the DateRanges to be created
    const dateRangeKeys = seasons.flatMap((season) => {
      // If the season is for a Park, add its ID for all applicable date types
      if (season.park) {
        const dateTypes = getDateTypesForPark(season.park, parkDateTypesByName);

        return dateTypes.map((dateType) => ({
          seasonId: season.id,
          dateableId: season.park.dateableId,
          dateTypeId: dateType.id,
        }));
      }

      // If the season is for a ParkArea, add IDs for all of its features
      // and applicable date types
      if (season.parkArea) {
        return season.parkArea.features.flatMap((feature) => {
          const dateTypes = getDateTypesForFeature(
            feature,
            featureDateTypesByName,
          );

          return dateTypes.map((dateType) => ({
            seasonId: season.id,
            dateableId: feature.dateableId,
            dateTypeId: dateType.id,
          }));
        });
      }

      // If the season is for a Feature, add its ID for all applicable date types
      if (season.feature) {
        const feature = season.feature;
        const dateTypes = getDateTypesForFeature(
          feature,
          featureDateTypesByName,
        );

        return dateTypes.map((dateType) => ({
          seasonId: season.id,
          dateableId: feature.dateableId,
          dateTypeId: dateType.id,
        }));
      }

      return [];
    });

    console.log(
      `${dateRangeKeys.length} applicable DateRanges. Checking if any exist already...`,
    );

    // Exclude the Operating date type,
    // handled by `populateBlankGateOperatingDates` in ./populate-blank-gate-dates.js
    const dateTypeIdWhere = parkDateTypesByName.Operating
      ? {
          [Op.not]: parkDateTypesByName.Operating.id,
        }
      : {};

    // Query existing DateRanges for these seasons
    const existingDateRanges = await DateRange.findAll({
      where: {
        seasonId: seasons.map((s) => s.id),

        dateTypeId: dateTypeIdWhere,
      },
      attributes: ["seasonId", "dateableId", "dateTypeId"],
      transaction,
    });

    console.log(
      `${existingDateRanges.length} applicable DateRanges already exist.`,
    );

    // Create a Set of existing DateRange keys to avoid creating duplicates
    const existingKeys = new Set(
      existingDateRanges.map((dateRange) =>
        getDateRangeKey(
          dateRange.seasonId,
          dateRange.dateableId,
          dateRange.dateTypeId,
        ),
      ),
    );

    // Get all the keys that need to be created:
    // dateRangeKeys that are not in existingKeys
    const keysToCreate = dateRangeKeys.filter(
      (key) =>
        !existingKeys.has(
          getDateRangeKey(key.seasonId, key.dateableId, key.dateTypeId),
        ),
    );

    if (keysToCreate.length === 0) {
      console.log("All applicable DateRanges exist - none to create");
    } else {
      console.log(`Creating ${keysToCreate.length} missing DateRanges`);
    }

    // Bulk insert the new DateRanges
    const createdRecords = await DateRange.bulkCreate(keysToCreate, {
      transaction,
    });

    console.log(
      `Created ${createdRecords.length} blank DateRanges for ${targetYear}`,
    );

    const createdGateDates = await populateBlankGateOperatingDates(
      Number(targetYear),
      transaction,
    );

    console.log(
      `Created ${createdGateDates.length} blank Park Gate Operating DateRanges for ${targetYear}`,
    );

    return [...createdRecords, ...createdGateDates];
  } catch (err) {
    console.error("Error populating blank DateRanges:", err);
    throw err;
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const targetYear = process.argv[2];
  // Run all queries in a transaction
  const transaction = await Season.sequelize.transaction();

  try {
    if (!targetYear || isNaN(targetYear)) {
      console.info("Usage example: node populate-blank-date-ranges.js 2097");
      throw new Error("Missing year argument");
    }

    const createdRecords = await populateBlankDateRangesForYear(
      Number(targetYear),
      transaction,
    );

    await transaction.commit();
    console.log("Done creating blank DateRanges for year", targetYear);
    console.log(`Created ${createdRecords.length} records`);
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
