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
} from "../../models/index.js";

import { get, post, put } from "./strapi-api.js";

const router = Router();

router.get(
  "/ready-to-publish",
  asyncHandler(async (req, res) => {
    // get all seasons that are approved and ready to be published
    const approvedSeasons = await Season.findAll({
      where: {
        status: "approved",
        readyToPublish: true,
      },
      attributes: ["id", "parkId", "featureTypeId"],
      raw: true,
    });

    // The frontend needs to display every park-feature pair only once
    // even if there are multiple seasons for that pair that are approved and ready to be published
    // here we are filtering out duplicates
    const parkFeaturePairs = [
      ...new Map(
        approvedSeasons.map((season) => [
          `${season.parkId}-${season.featureTypeId}`, // Unique key for the pair
          { parkId: season.parkId, featureTypeId: season.featureTypeId }, // Original object
        ]),
      ).values(),
    ];

    // get all features that are part of the approved and ready to be published seasons
    const matchingFeatures = await Feature.findAll({
      where: {
        [Op.or]: parkFeaturePairs,
      },
      attributes: ["id", "name", "strapiId"],
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

    // if feature has a campground prepend feature name with campground name
    // some features' names only make sense in the context of a campground
    const output = features
      .map((feature) => {
        if (feature.campground) {
          feature.name = `${feature.campground.name} - ${feature.name}`;
        }

        return feature;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

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
 * Get all the dates for each feature-year pair and mark them as inactive
 * @param {Array<Object>} featureYearPairs list of featureId-operatingYear pairs
 * @returns {Promise<any>} Promise that resolves when all the dates are marked as inactive
 */
async function markCurrentDatesInactive(featureYearPairs) {
  // get all the dates for each feature-year pair
  // for each pair send a request to the API to mark the dates as inactive

  return Promise.all(
    featureYearPairs.map(async (pair) => {
      const { featureId, operatingYear } = pair;

      const dates = await getFeatureStrapiDates(featureId, operatingYear);

      await markFeatureDatesInactive(dates);
    }),
  );
}

/**
 * Mark all the current dates for each feature-year pair as inactive and create new records in the Strapi API
 * @param {Object} table table of dates grouped by operating year and feature
 * @returns {void}
 */
async function publishToAPI(table) {
  const datesToPublish = [];

  Object.entries(table).forEach(([operatingYear, features]) => {
    Object.entries(features).forEach(([featureId, dateRanges]) => {
      // sort operating and reservation dates by start date
      const operatingDates = dateRanges
        .filter((dateRange) => dateRange.dateType.name === "Operation")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const reservationDates = dateRanges
        .filter((dateRange) => dateRange.dateType.name === "Reservation")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      // Since in Strapi, a single date object contains both operating and reservation dates
      // we will create an object in Strapi for each pair of operating and reservation dates
      // if there are any dates that can't be grouped, they will their own object with null values for the other date types
      const maxIndex = Math.max(operatingDates.length, reservationDates.length);

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
          obj.serviceStartDate = operatingDate.startDate;
          obj.serviceEndDate = operatingDate.endDate;
        }

        if (reservationDate) {
          obj.reservationStartDate = reservationDate.startDate;
          obj.reservationEndDate = reservationDate.endDate;
        }
        datesToPublish.push(obj);
      }
    });
  });

  // get all the feature-year pairs from table -- > [ { featureId, operatingYear }, ... ]
  const featureYearPairs = Object.entries(table).reduce(
    (acc, [operatingYear, features]) => [
      ...acc,
      ...Object.keys(features).map((featureId) => ({
        featureId,
        operatingYear,
      })),
    ],
    [],
  );

  // mark all the current dates for each feature-year pair as inactive
  await markCurrentDatesInactive(featureYearPairs);

  // create new records in the strapi API
  await createRecordsInStrapi(datesToPublish);
}

// - send data to the API
router.get(
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

    const seasons = approvedSeasons.map((season) => season.toJSON());

    // we need to group dateranges by operating year and feature
    // The date object in strapi contains both the operating and reservation dates for a feature - operatingYear pair
    // we'll group all the date ranges by feature and operating year and then we'll group them if possible
    const table = {};

    seasons.forEach((season) => {
      const { operatingYear } = season;

      if (!table[operatingYear]) {
        table[operatingYear] = {};
      }

      const { dateRanges } = season;

      dateRanges.forEach((dateRange) => {
        const { dateable } = dateRange;
        const { feature } = dateable;

        // feature is a list of one element
        const strapiId = feature[0].strapiId;

        if (!table[operatingYear][strapiId]) {
          table[operatingYear][strapiId] = [];
        }

        table[operatingYear][strapiId].push(dateRange);
      });
    });

    // will send the data to the API asynchronously - we don't need to wait for the response
    publishToAPI(table);

    // send 200 OK response with empty body
    res.send();
  }),
);

export default router;
