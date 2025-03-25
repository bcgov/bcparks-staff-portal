import { Router } from "express";
import _ from "lodash";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  Dateable,
  Campground,
  SeasonChangeLog,
  User,
} from "../../models/index.js";

function getFeatureName(feature) {
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

const router = Router();

router.get(
  "/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const winterSeasonDetails = await Season.findByPk(seasonId, {
      attributes: ["id", "operatingYear", "status", "readyToPublish"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name", "icon"],
        },
        {
          model: Park,
          as: "park",
          attributes: ["id", "name", "orcs"],
        },
        {
          model: SeasonChangeLog,
          as: "changeLogs",
          attributes: ["id", "notes", "createdAt"],
          // Filter out empty notes
          where: {
            notes: {
              [Op.ne]: "",
            },
          },
          required: false,
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    const winterSeason = winterSeasonDetails.toJSON();

    const { operatingYear } = winterSeason;
    const parkId = winterSeason.park.id;

    const featureList = await Feature.findAll({
      attributes: ["id", "name", "hasReservations", "active"],
      where: {
        parkId,
        active: true,
        hasWinterFeeDates: true,
      },
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name", "icon"],
        },
        {
          model: Campground,
          as: "campground",
          required: false,
          attributes: ["id", "name"],
        },
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id", "startDate", "endDate"],
              include: [
                {
                  model: Season,
                  as: "season",
                  attributes: ["id", "operatingYear"],
                  required: true,
                  where: {
                    operatingYear: {
                      [Op.in]: [operatingYear, operatingYear - 1],
                    },
                  },
                },
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name", "description"],
                  required: true,
                  where: {
                    name: {
                      [Op.in]: ["Winter fee", "Reservation"],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    let features = featureList.map((feature) => feature.toJSON());

    // Order features alphabetically before grouping by campground
    features = _.orderBy(features, ["name"], ["asc"]);

    // Map to group features by featureType
    const featureTypeMap = {};

    let winterFeeDateType = null;

    features.forEach((feature) => {
      const featureType = feature.featureType;

      // If featureType is not in the map, add it
      if (!featureTypeMap[featureType.id]) {
        featureTypeMap[featureType.id] = {
          ...featureType,
          features: [],
        };
      }

      //
      const featureData = {
        id: feature.id,
        hasReservations: feature.hasReservations,
        name: getFeatureName(feature),
        dateableId: feature.dateable.id,
        currentWinterDates: [],
        previousWinterDates: [],
        currentReservationDates: [],
        previousReservationDates: [],
      };

      // group dateRanges by operatingYear and type
      const sortedDates = _.orderBy(feature.dateable.dateRanges, "startDate");

      sortedDates.forEach((dateRange) => {
        const dateRangeItem = {
          id: dateRange.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        };

        if (dateRange.dateType.name === "Winter fee") {
          if (dateRange.season.operatingYear === operatingYear) {
            featureData.currentWinterDates.push(dateRangeItem);
          } else {
            featureData.previousWinterDates.push(dateRangeItem);
          }

          if (!winterFeeDateType) {
            winterFeeDateType = dateRange.dateType;
          }
        } else if (dateRange.dateType.name === "Reservation") {
          if (dateRange.season.operatingYear === operatingYear) {
            featureData.currentReservationDates.push(dateRangeItem);
          } else {
            featureData.previousReservationDates.push(dateRangeItem);
          }
        }
      });

      featureTypeMap[featureType.id].features.push(featureData);
    });

    const featureTypeList = Object.values(featureTypeMap);

    const payload = {
      ...winterSeason,
      name: `${operatingYear} – ${operatingYear + 1}`,
      previousSeasonName: `${operatingYear - 1} – ${operatingYear}`,
      winterFeeDateType,
      featureTypes: featureTypeList,
    };

    res.json(payload);
  }),
);

export default router;
