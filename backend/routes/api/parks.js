import { Router } from "express";
import _ from "lodash";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateRange,
  DateType,
  Dateable,
  Campground,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

const router = Router();

function getParkStatus(seasons) {
  // if any season has status==requested, return requested
  // else if any season has status==pending review, return pending review
  // else if any season has status==approved, return approved
  // if all seasons have status==published, return published

  const requested = seasons.some((s) => s.status === "requested");

  if (requested) {
    return "requested";
  }

  const pendingReview = seasons.some((s) => s.status === "pending review");

  if (pendingReview) {
    return "pending review";
  }

  const approved = seasons.some((s) => s.status === "approved");

  if (approved) {
    return "approved";
  }

  const published = seasons.every((s) => s.status === "published");

  if (published) {
    return "published";
  }

  return null;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parksWithBundlesAndSeasons = await Park.findAll({
      attributes: ["id", "orcs", "name"],
      include: [
        {
          model: Season,
          as: "seasons",
          attributes: ["id", "status", "readyToPublish"],
        },
        {
          model: Feature,
          as: "features",
          attributes: ["id", "hasReservations"],
          include: [
            {
              model: Dateable,
              as: "dateable",
              attributes: ["id"],
              include: [
                {
                  model: DateRange,
                  as: "dateRanges",
                  attributes: ["id"],
                },
              ],
            },
          ],
        },
      ],
    });

    const parks = parksWithBundlesAndSeasons.map((park) => park.toJSON());

    const output = parks
      .filter((item) =>
        item.features.some((feature) => feature.dateable.dateRanges.length > 0),
      )
      .map((park) => ({
        id: park.id,
        name: park.name,
        orcs: park.orcs,
        status: getParkStatus(park.seasons),
        hasReservations: park.features.some(
          (feature) => feature.hasReservations && feature.active,
        ),
        readyToPublish: park.seasons.every((s) => s.readyToPublish),
      }));

    // Return all rows
    res.json(output);
  }),
);

router.get(
  "/:orcs",
  asyncHandler(async (req, res) => {
    const { orcs } = req.params;

    const park = await Park.findOne({
      where: { orcs },
      attributes: ["orcs", "name"],
      include: [
        {
          model: Season,
          as: "seasons",
          attributes: [
            "id",
            "operatingYear",
            "status",
            "updatedAt",
            "readyToPublish",
          ],
          include: [
            {
              model: FeatureType,
              as: "featureType",
              attributes: ["id", "name", "icon"],
            },
          ],
        },
      ],
    });

    if (!park) {
      const error = new Error(`Park not found: ${orcs}`);

      error.status = 404;
      throw error;
    }

    const parkJson = park.toJSON();

    const subAreas = _.mapValues(
      // group seasons by feature type
      _.groupBy(parkJson.seasons, (s) => s.featureType.name),

      // sort by year
      (group) => _.orderBy(group, ["operatingYear"], ["desc"]),
    );

    // remove unused season key
    delete parkJson.seasons;

    res.json({ ...parkJson, subAreas });
  }),
);

router.get(
  "/ready-to-publish/",
  asyncHandler(async (req, res) => {
    const approvedSeasons = await Season.findAll({
      where: {
        status: "approved",
        readyToPublish: true,
      },
      attributes: ["id", "parkId", "featureTypeId"],
      raw: true,
    });

    const parkFeaturePairs = [
      ...new Map(
        approvedSeasons.map((season) => [
          `${season.parkId}-${season.featureTypeId}`, // Unique key for the pair
          { parkId: season.parkId, featureTypeId: season.featureTypeId }, // Original object
        ]),
      ).values(),
    ];

    const matchingFeatures = await Feature.findAll({
      where: {
        [Op.or]: parkFeaturePairs,
      },
      attributes: ["id", "name"],
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
    const output = features.map((feature) => {
      if (feature.campground) {
        feature.name = `${feature.campground.name} - ${feature.name}`;
      }

      return feature;
    });

    res.send({ features: output });
  }),
);

// TODO: make it a post request
// - send data to the API
router.get(
  "/publish-to-api/",
  asyncHandler(async (req, res) => {
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

        console.log(feature);
        const strapiId = feature[0].strapiId;

        if (!table[operatingYear][strapiId]) {
          console.log(strapiId);
          table[operatingYear][strapiId] = [];
        }

        table[operatingYear][strapiId].push(dateRange);
      });
    });

    const datesToPublish = [];

    console.log(table);

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
