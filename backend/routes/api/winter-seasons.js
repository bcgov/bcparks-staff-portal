import { Router } from "express";
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
  DateChangeLog,
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
      attributes: ["id", "name", "active"],
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

    const features = featureList.map((feature) => feature.toJSON());

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
        name: getFeatureName(feature),
        dateableId: feature.dateable.id,
        currentWinterDates: [],
        previousWinterDates: [],
        currentReservationDates: [],
      };

      // group dateRanges by operatingYear and type
      feature.dateable.dateRanges.forEach((dateRange) => {
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
        } else if (
          dateRange.dateType.name === "Reservation" &&
          dateRange.season.operatingYear === operatingYear
        ) {
          featureData.currentReservationDates.push(dateRangeItem);
        }
      });

      featureTypeMap[featureType.id].features.push(featureData);
    });

    const featureTypeList = Object.values(featureTypeMap);

    const payload = {
      ...winterSeason,
      name: `${operatingYear} - ${operatingYear + 1}`,
      winterFeeDateType,
      featureTypes: featureTypeList,
    };

    res.json(payload);
  }),
);

// save draft (role determined by user)
router.post(
  "/:seasonId/save/",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);
    const { notes, dates, readyToPublish } = req.body;

    // when we add roles: we need to check that this user has permission to edit this season
    // staff or operator that has access to this park

    const season = await Season.findByPk(seasonId, {
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id"],
        },
      ],
    });

    if (!season) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    // this will depend on the user's role
    // right now we're just setting everything to requested
    // const newStatus = getNewStatusForSeason(season, null);

    // create season change log
    const seasonChangeLog = await SeasonChangeLog.create({
      seasonId,
      // TODO: get real user ID from session
      userId: 1,
      notes,
      statusOldValue: season.status,
      statusNewValue: "requested",
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: readyToPublish,
    });

    // update season
    Season.update(
      {
        readyToPublish,
        status: "requested",
      },
      {
        where: {
          id: seasonId,
        },
      },
    );

    dates.forEach(async (date) => {
      if (date.id && date.changed) {
        // get dateRange
        const dateRange = await DateRange.findByPk(date.id);

        // create date change log
        DateChangeLog.create({
          dateRangeId: date.id,
          seasonChangeLogId: seasonChangeLog.id,
          startDateOldValue: dateRange.startDate,
          startDateNewValue: date.startDate,
          endDateOldValue: dateRange.endDate,
          endDateNewValue: date.endDate,
        });

        // update
        DateRange.update(
          {
            startDate: date.startDate,
            endDate: date.endDate,
          },
          {
            where: {
              id: date.id,
            },
          },
        );
      } else if (!date.id) {
        // Skip creating empty date ranges
        if (date.startDate === null && date.endDate === null) return;

        // if date doesn't have ID, it's a new date
        DateRange.create({
          seasonId,
          dateableId: date.dateableId,
          dateTypeId: date.dateTypeId,
          startDate: date.startDate,
          endDate: date.endDate,
        });
      }
    });

    res.sendStatus(200);
  }),
);

export default router;
