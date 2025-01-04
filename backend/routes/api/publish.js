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

// TODO: make it a post request
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

    const datesToPublish = [];

    Object.entries(table).forEach(([operatingYear, features]) => {
      Object.entries(features).forEach(([featureId, dateRanges]) => {
        const operatingDates = dateRanges
          .filter((dateRange) => dateRange.dateType.name === "Operation")
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const reservationDates = dateRanges
          .filter((dateRange) => dateRange.dateType.name === "Reservation")
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const maxIndex = Math.max(
          operatingDates.length,
          reservationDates.length,
        );

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

    res.json(datesToPublish);
  }),
);

export default router;
