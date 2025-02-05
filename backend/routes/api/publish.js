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
  Campground,
  FeatureType,
} from "../../models/index.js";

import { get, post, put } from "./strapi-api.js";

const router = Router();

export function getFeatureName(feature) {
  // if feature has a campground, and feature.name is "All sites", return campground name
  // if feature has a campground, and feature.name is not "All sites", return "campgroundName: feature.name"
  // if feature does not have a campground, return feature.name
  const { campground, name } = feature;

  if (campground) {
    return name === "All sites"
      ? campground.name
      : `${campground.name}: ${name}`;
  }

  return name;
}

router.get(
  "/ready-to-publish",
  asyncHandler(async (req, res) => {
    // get all seasons that are approved and ready to be published
    const approvedSeasons = await Season.findAll({
      where: {
        status: "approved",
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
      const key = `${season.parkId}-${season.featureType.id}`;

      if (!seasonMap[key]) {
        seasonMap[key] = {
          fetchConditions: {
            parkId: season.parkId,
            featureTypeId: season.featureType.id,
          },
          seasons: [],
        };

        seasonMap[key].seasons.push({
          operatingYear: season.operatingYear,
          readyToPublish: season.readyToPublish,
        });
      }
    });

    const parkFeaturePairs = Object.values(seasonMap).map(
      (season) => season.fetchConditions,
    );

    // get all features that are part of the approved and ready to be published seasons
    const matchingFeatures = await Feature.findAll({
      where: {
        [Op.or]: parkFeaturePairs,
      },
      attributes: ["id", "name", "strapiId", "featureTypeId"],
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id", "orcs", "name"],
        },
        {
          model: Campground,
          as: "campground",
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
      const featuresToAdd = seasonData.seasons.map((season) => ({
        ...feature,
        name: getFeatureName(feature),
        season: season.operatingYear,
        readyToPublish: season.readyToPublish,
      }));

      output.push(...featuresToAdd);
    });

    res.send({ features: output });
  }),
);

/**
 * Dates added in the staff portal will be sent to the Strapi API - new records will be created
 * @param {Array<Object>} datesToPublish list of dates that will be published to the API
 * @returns {Promise<any>} Promise that resolves when all the records are created in the API
 */
async function createRecordsInStrapi(datesToPublish) {
  // create new records in the strapi API
  const endpoint = "/api/park-operation-sub-area-dates";

  return Promise.all(
    datesToPublish.map(async (date) => {
      try {
        const data = {
          data: date,
        };

        await post(endpoint, data);
      } catch (error) {
        console.error(
          `Error creating date for featureId ${date.parkOperationSubArea} and year ${date.operatingYear}`,
          error,
        );
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
async function getFeatureStrapiDates(featureId, operatingYear) {
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
 * Mark all the dates for this feature-year pair as inactive
 * @param {Array<Object>} dates list of dates to be marked as inactive
 * @returns {Promise<any>} Promise that resolves when all the dates are marked as inactive
 */
async function markFeatureDatesInactive(dates) {
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
 * Marking the season as published in our DB
 * @param {number} seasonId the id of the season to mark as published
 * @returns {void}
 */
async function markSeasonPublished(seasonId) {
  const season = await Season.findByPk(seasonId);

  season.status = "on API";
  season.save();
}

/**
 * Mark all the current dates for each feature-year pair as inactive and create new records in the Strapi API
 * @param {Object} seasonTable table of dates grouped by operating year and feature
 * @returns {void}
 */
async function publishToAPI(seasonTable) {
  // using this instead of Object.entries because we want to only update the data of one season at a time
  // to not overload the Strapi API and to make sure that a each season either succeeds or not
  for (const [seasonId, { operatingYear, features }] of Object.entries(
    seasonTable,
  )) {
    // everything inside this loop iteration is related to a single season
    await Promise.all(
      Object.entries(features).map(async ([featureId, dateRanges]) => {
        // everything in this loop iteration is related to a single feature in a season

        // mark all the dates for this feature-year pair as inactive in Strapi
        const dates = await getFeatureStrapiDates(featureId, operatingYear);

        await markFeatureDatesInactive(dates.data);

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
        await createRecordsInStrapi(groupedSeasonDates);
      }),
    );

    // mark this season as published when everything related to it is done
    markSeasonPublished(seasonId);
  }
}

// - send data to the API
router.post(
  "/publish-to-api/",
  asyncHandler(async (req, res) => {
    // get all seasons that are approved and ready to be published
    // and the associated objects we need to build the payload
    const approvedSeasons = await Season.findAll({
      where: {
        status: "approved",
        readyToPublish: true,
      },
      attributes: ["id", "parkId", "featureTypeId", "operatingYear"],
      include: [
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

    Promise.all(
      approvedSeasons.map(async (season) => {
        season.status = "published";
        await season.save();

        console.log(season.status);
      }),
    );

    // TODO: commenting out the code below to not update strapi until new strucutre is in place
    // we need to group dateranges by season and then feature
    // we'll create a table that looks
    // {
    //   seasonId: {
    //     operatingYear: 2024,
    //     features: {
    //       1: [dateRange, dateRange],
    //       2: [dateRange, dateRange],
    //     },
    //   }
    // }

    // const seasonTable = {};

    // seasons.forEach((season) => {
    //   const { operatingYear } = season;

    //   seasonTable[season.id] = {
    //     operatingYear,
    //     features: {},
    //   };

    //   const { dateRanges } = season;

    //   dateRanges.forEach((dateRange) => {
    //     const { dateable } = dateRange;
    //     const { feature } = dateable;

    //     // feature is always an array with one element
    //     const strapiId = feature[0].strapiId;

    //     if (!seasonTable[season.id].features[strapiId]) {
    //       seasonTable[season.id].features[strapiId] = [];
    //     }

    //     seasonTable[season.id].features[strapiId].push(dateRange);
    //   });
    // });

    // publishToAPI(seasonTable);

    // send 200 OK response with empty body
    res.send();
  }),
);

export default router;
