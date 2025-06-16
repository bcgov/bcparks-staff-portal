import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

import {
  Park,
  Season,
  Feature,
  DateRange,
  DateType,
  Dateable,
  ParkArea,
  FeatureType,
} from "../../models/index.js";

import {
  adminsAndApprovers,
  checkPermissions,
} from "../../middleware/permissions.js";

import { get, post, put } from "./strapi-api.js";
import * as STATUS from "../../constants/seasonStatus.js";

const router = Router();

export function getFeatureName(feature) {
  // if feature has a parkArea, and feature.name is "All sites", return parkArea name
  // if feature has a parkArea, and feature.name is not "All sites", return "parkAreaName: feature.name"
  // if feature does not have a parkArea, return feature.name
  const { parkArea, name } = feature;

  if (parkArea) {
    return name === "All sites" ? parkArea.name : `${parkArea.name}: ${name}`;
  }

  return name;
}

function getSeasonName(season) {
  if (season.isWinterSeason) {
    return `${season.operatingYear} - ${season.operatingYear + 1}`;
  }

  return season.operatingYear;
}

function getSeasonKey(season) {
  // winter fee seasons are grouped by parkId only
  if (season.featureType.name === "Winter fee") {
    return season.parkId;
  }

  return `${season.parkId}-${season.featureType.id}`;
}

router.get(
  "/ready-to-publish",
  asyncHandler(async (req, res) => {
    // @TODO: Reimplement this endpoint to use the publishable model
    const error = new Error("Not implemented yet");

    error.status = 501;
    throw error;

    // get all seasons that are approved and ready to be published
    const approvedSeasons = await Season.findAll({
      where: {
        status: STATUS.APPROVED,
      },
      attributes: ["id", "parkId", "operatingYear", "readyToPublish"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
        },
      ],
    });

    const seasonMap = {};

    approvedSeasons.forEach((season) => {
      // winter seasons are grouped by parkId, regular seasons by parkId and featureTypeId
      const key = getSeasonKey(season);

      if (!seasonMap[key]) {
        // fetch conditions are different for winter seasons
        // we use the `hasWinterFeeDates` flag instead of the `featureTypeId`
        if (season.featureType.name === "Winter fee") {
          seasonMap[key] = {
            fetchConditions: {
              parkId: season.parkId,
              hasWinterFeeDates: true,
            },
            seasons: [],
          };
        } else {
          seasonMap[key] = {
            fetchConditions: {
              parkId: season.parkId,
              featureTypeId: season.featureType.id,
            },
            seasons: [],
          };
        }
      }

      // each park-featureType pair can have multiple seasons
      seasonMap[key].seasons.push({
        operatingYear: season.operatingYear,
        readyToPublish: season.readyToPublish,
        isWinterSeason: season.featureType.name === "Winter fee",
      });
    });

    const parkFeaturePairs = Object.values(seasonMap).map(
      (season) => season.fetchConditions,
    );

    // get all features that are part of the approved and ready to be published seasons
    const matchingFeatures = await Feature.findAll({
      where: {
        [Op.or]: parkFeaturePairs,
      },
      attributes: [
        "id",
        "name",
        "strapiId",
        "featureTypeId",
        "hasWinterFeeDates",
      ],
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id", "orcs", "name"],
        },
        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id", "name"],
        },
      ],
    });

    const features = matchingFeatures.map((feature) => feature.toJSON());

    const output = [];

    features.forEach((feature) => {
      const { featureTypeId } = feature;
      const parkId = feature.park.id;

      const key = `${parkId}-${featureTypeId}`;
      const seasonData = seasonMap[key];

      // for this feature, try to add a row for every regular season that has it
      if (seasonData) {
        seasonData.seasons.forEach((season) => {
          output.push({
            ...feature,
            name: getFeatureName(feature),
            season: getSeasonName(season),
            readyToPublish: season.readyToPublish,
          });
        });
      }

      // if this feature has winter fee dates, add a row for every winter season that has it
      if (feature.hasWinterFeeDates && seasonMap[parkId]) {
        const winterFeeSeasons = seasonMap[parkId].seasons;

        winterFeeSeasons.forEach((season) => {
          output.push({
            ...feature,
            name: getFeatureName(feature),
            season: getSeasonName(season),
            readyToPublish: season.readyToPublish,
          });
        });
      }
    });

    res.send({ features: output });
  }),
);

/**
 * Dates added in the staff portal will be sent to the Strapi API - new records will be created
 * @param {Array<Object>} datesToPublish list of dates that will be published to the API
 * @returns {Promise<any>} Promise that resolves when all the records are created in the API
 */
async function createParkOperationSubAreaDatesInStrapi(datesToPublish) {
  // create new records in the strapi API
  const endpoint = "/api/park-operation-sub-area-dates";

  return Promise.all(
    datesToPublish.map(async (date) => {
      try {
        const data = {
          data: date,
        };

        return await post(endpoint, data);
      } catch (error) {
        console.error(
          `Error creating date for featureId ${date.parkOperationSubArea} and year ${date.operatingYear}`,
          error,
        );
        return null;
      }
    }),
  );
}

async function createParkFeatureDatesInStrapi(dates) {
  // create new records in the strapi API
  const endpoint = "/api/park-feature-dates";

  return Promise.all(
    dates.map(async (date) => {
      try {
        const data = {
          data: date,
        };

        return await post(endpoint, data);
      } catch (error) {
        console.error(
          `Error creating date for featureId ${date.parkOperationSubArea} and year ${date.operatingYear}`,
          error,
        );
        return null;
      }
    }),
  );
}

/**
 * For each featureId and operatingYear pair, get all the dates from the Strapi API - these will be marked as inactive
 * @param {number} featureId id of the feature
 * @param {any} operatingYear operating year of the date object
 * @returns {Promise<Object>} Promise that resolves with the dates from the Strapi API
 */
async function getStrapiParkOperationSubAreaDates(featureId, operatingYear) {
  try {
    // filter by featureId and operatingYear
    const endpoint = `/api/park-operation-sub-area-dates?filters[parkOperationSubArea]=${featureId}&filters[operatingYear]=${operatingYear}`;

    const response = await get(endpoint);

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching dates for featureId ${featureId} and year ${operatingYear}`,
      error,
    );
    return [];
  }
}

/**
 * For each featureId and operatingYear pair, get all the dates from the Strapi API - these will be marked as inactive
 * @param {number} featureId id of the feature
 * @param {any} operatingYear operating year of the date object
 * @returns {Promise<Object>} Promise that resolves with the dates from the Strapi API
 */
async function getStrapiParkFeatureDates(featureId, operatingYear) {
  try {
    // filter by featureId and operatingYear
    const endpoint = `/api/park-feature-dates?filters[parkOperationSubArea]=${featureId}&filters[operatingYear]=${operatingYear}`;

    const response = await get(endpoint);

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching dates for featureId ${featureId} and year ${operatingYear}`,
      error,
    );
    return [];
  }
}

/**
 * Mark all the dates for this feature-year pair as inactive
 * @param {Array<Object>} dates list of dates to be marked as inactive
 * @returns {Promise<any>} Promise that resolves when all the dates are marked as inactive
 */
async function markStrapiParkOperationSubAreaDatesInactive(dates) {
  return Promise.all(
    dates.map(async (date) => {
      try {
        // send the entire object with isActive set to false
        const data = {
          data: {
            ...date.attributes,
            isActive: false,
          },
        };

        const endpoint = `/api/park-operation-sub-area-dates/${date.id}`;
        const response = await put(endpoint, data);

        return response.data;
      } catch (error) {
        console.error(`Error marking date ${date.id} as inactive`, error);
        return null;
      }
    }),
  );
}

/**
 * Mark all the dates for this feature-year pair as inactive
 * @param {Array<Object>} dates list of dates to be marked as inactive
 * @returns {Promise<any>} Promise that resolves when all the dates are marked as inactive
 */
async function markStrapiParkFeatureDatesInactive(dates) {
  return Promise.all(
    dates.map(async (date) => {
      try {
        // send the entire object with isActive set to false
        const data = {
          data: {
            ...date.attributes,
            isActive: false,
          },
        };

        const endpoint = `/api/park-feature-dates/${date.id}`;
        const response = await put(endpoint, data);

        return response.data;
      } catch (error) {
        console.error(`Error marking date ${date.id} as inactive`, error);
        return null;
      }
    }),
  );
}

/**
 * Mark all the current dates for each feature-year pair as inactive and create new records in the Strapi API
 * @param {Object} seasonTable table of dates grouped by operating year and feature
 * @returns {void}
 */
async function publishToAPI(seasonTable) {
  // using this instead of Object.entries because we want to only update the data of one season at a time
  // to not overload the Strapi API and to make sure that a each season either succeeds or not
  for (const { operatingYear, featureType, features } of Object.values(
    seasonTable,
  )) {
    // TODO: Publish all date types to Strapi /park-feature-dates
    if (featureType.name === "Winter fee") {
      Object.entries(features).map(async ([featureId, dateRanges]) => {
        // get strapi dates
        const dates = await getStrapiParkFeatureDates(featureId, operatingYear);

        // mark all the dates for this feature-year pair as inactive in Strapi
        await markStrapiParkFeatureDatesInactive(dates.data);

        // send the new dates to the API
        const dateRangesToPublish = dateRanges.map((dateRange) => ({
          isActive: true,
          operatingYear,
          startDate: new Date(dateRange.startDate).toISOString().split("T")[0],
          endDate: new Date(dateRange.endDate).toISOString().split("T")[0],
          dateType: "Winter fee",
          parkOperationSubArea: featureId,
        }));

        await createParkFeatureDatesInStrapi(dateRangesToPublish);
      });
    } else {
      // everything inside this loop iteration is related to a single season
      await Promise.all(
        Object.entries(features).map(async ([featureId, dateRanges]) => {
          // everything in this loop iteration is related to a single feature in a season
          // mark all the dates for this feature-year pair as inactive in Strapi
          const dates = await getStrapiParkOperationSubAreaDates(
            featureId,
            operatingYear,
          );

          await markStrapiParkOperationSubAreaDatesInactive(dates.data);

          // The date object in strapi contains both the operating and reservation dates for a feature - operatingYear pair
          // we'll group all the date ranges by feature and operating year and then we'll group them if possible
          // If there are remaining dates, we'll create a new date object with the remaining dates
          const operatingDates = dateRanges
            .filter((dateRange) => dateRange.dateType.name === "Operation")
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

          const reservationDates = dateRanges
            .filter((dateRange) => dateRange.dateType.name === "Reservation")
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

          // determine how many date objects we need to create
          const maxIndex = Math.max(
            operatingDates.length,
            reservationDates.length,
          );

          const groupedSeasonDates = [];

          for (let i = 0; i < maxIndex; i++) {
            const obj = {
              operatingYear,
              parkOperationSubArea: featureId,
              isActive: true,
              openDate: null,
              closeDate: null,
              serviceStartDate: null,
              serviceEndDate: null,
              reservationStartDate: null,
              reservationEndDate: null,
              offSeasonStartDate: null,
              offSeasonEndDate: null,
              adminNote: null,
            };

            const operatingDate = operatingDates[i];
            const reservationDate = reservationDates[i];

            if (operatingDate) {
              obj.serviceStartDate = new Date(operatingDate.startDate)
                .toISOString()
                .split("T")[0];
              obj.serviceEndDate = new Date(operatingDate.endDate)
                .toISOString()
                .split("T")[0];
            }

            if (reservationDate) {
              obj.reservationStartDate = new Date(reservationDate.startDate)
                .toISOString()
                .split("T")[0];
              obj.reservationEndDate = new Date(reservationDate.endDate)
                .toISOString()
                .split("T")[0];
            }

            groupedSeasonDates.push(obj);
          }
          // add all the dates for this feature in Strapi
          await createParkOperationSubAreaDatesInStrapi(groupedSeasonDates);
        }),
      );
    }
  }
}

// - send data to the API
router.post(
  "/publish-to-api/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    // @TODO: Reimplement this endpoint to use the publishable model
    const error = new Error("Not implemented yet");

    error.status = 501;
    throw error;

    // get all seasons that are approved and ready to be published
    // and the associated objects we need to build the payload
    const approvedSeasons = await Season.findAll({
      where: {
        status: STATUS.APPROVED,
        readyToPublish: true,
      },
      attributes: ["id", "parkId", "featureTypeId", "operatingYear"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
        },
        {
          model: DateRange,
          as: "dateRanges",
          attributes: ["id", "startDate", "endDate"],
          include: [
            {
              model: DateType,
              as: "dateType",
              attributes: ["id", "name"],
            },
            {
              model: Dateable,
              as: "dateable",
              attributes: ["id"],
              include: [
                {
                  model: Feature,
                  as: "feature",
                  attributes: ["id", "name", "strapiId"],
                },
              ],
            },
          ],
        },
      ],
    });

    // we need to group dateranges by season and then feature
    // we'll create a table that looks
    // {
    //   seasonId: {
    //     operatingYear: 2024,
    //     featureTYpe: { name: "Winter fee" },
    //     features: {
    //       1: [dateRange, dateRange],
    //       2: [dateRange, dateRange],
    //     },
    //   }
    // }

    const seasonTable = {};

    approvedSeasons.forEach((season) => {
      const { operatingYear } = season;

      seasonTable[season.id] = {
        operatingYear,
        featureType: season.featureType,
        features: {},
      };

      const { dateRanges } = season;

      dateRanges.forEach((dateRange) => {
        const { dateable } = dateRange;
        const { feature } = dateable;

        // feature is always an array with one element
        const strapiId = feature[0].strapiId;

        if (!seasonTable[season.id].features[strapiId]) {
          seasonTable[season.id].features[strapiId] = [];
        }

        seasonTable[season.id].features[strapiId].push(dateRange);
      });
    });

    publishToAPI(seasonTable);

    const seasonIds = approvedSeasons.map((season) => season.id);

    Season.update(
      {
        status: STATUS.PUBLISHED,
      },
      {
        where: {
          id: {
            [Op.in]: seasonIds,
          },
        },
      },
    );

    // send 200 OK response with empty body
    res.send();
  }),
);

export default router;
