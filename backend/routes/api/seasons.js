import { Router } from "express";
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
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

const router = Router();

// function getNewStatusForSeason(season, user) {
//   // this will depend on the user's role
//   // rn we're just setting everything to requested
//   // For staff
//   //   requested -- > requested
//   //   under review -- > under review
//   //   approved -- > under review
//   //   published --> under review
//   // For operator
//   //   requested -- > requested
//   //   under review -- > requested
//   //   approved -- > requested
//   //   published --> requested
//   return season.status;
// }

router.get(
  "/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const seasonModel = await Season.findByPk(seasonId, {
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

    if (!seasonModel) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    const season = seasonModel.toJSON();
    const prevSeason = await Season.findOne({
      where: {
        parkId: season.park.id,
        featureTypeId: season.featureType.id,
        operatingYear: season.operatingYear - 1,
      },
      attributes: ["id"],
    });

    // we want to get the features for this season and the previous season
    // seasonsIds will be used to query the date ranges
    const seasonIds = [season.id];

    if (prevSeason) {
      seasonIds.push(prevSeason.id);
    }

    // we fetch features separately
    // later assign each feature's date ranges to the respective season
    const parkFeatures = await Feature.findAll({
      where: {
        parkId: season.park.id,
        active: true,
        featureTypeId: season.featureType.id,
      },
      attributes: ["id", "name", "hasReservations", "active"],
      include: [
        {
          model: Campground,
          as: "campground",
          attributes: ["id", "name"],
        },
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          required: false,
          include: [
            // get all the dateRanges for this feature for this season and previous season
            {
              model: DateRange,
              as: "dateRanges",
              required: false,
              attributes: ["id", "seasonId", "startDate", "endDate"],
              include: [
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name", "description"],
                },
              ],
              where: {
                seasonId: {
                  [Op.or]: seasonIds,
                },
              },
            },
          ],
        },
      ],
    });

    // we want to get all the date types for this season
    const dateTypes = {};

    const features = parkFeatures.map((featureObj) => {
      const feature = featureObj.toJSON();

      // each feature will have an array of date ranges for the current season and the previous season
      // we'll remove the dateRanges array and add currentSeasonDates and previousSeasonDates arrays
      // so that the client can easily sort them
      feature.dateable.currentSeasonDates = [];
      feature.dateable.previousSeasonDates = [];

      feature.dateable.dateRanges.forEach((dateRange) => {
        if (!dateTypes[dateRange.dateType.name]) {
          dateTypes[dateRange.dateType.name] = dateRange.dateType;
        }

        if (dateRange.seasonId === season.id) {
          feature.dateable.currentSeasonDates.push(dateRange);
        }

        if (dateRange.seasonId === prevSeason?.id) {
          feature.dateable.previousSeasonDates.push(dateRange);
        }
      });
      delete feature.dateable.dateRanges;
      return feature;
    });

    const campgroundsMap = {};

    // some features are grouped by campgrounds
    // we want to assign each feature to the respective campground if it exists
    features.forEach((feature) => {
      if (feature.campground) {
        if (!campgroundsMap[feature.campground.id]) {
          campgroundsMap[feature.campground.id] = {
            id: feature.campground.id,
            name: feature.campground.name,
            features: [],
          };
        }

        campgroundsMap[feature.campground.id].features.push(feature);
      }
    });

    const campgrounds = Object.values(campgroundsMap);

    const output = {
      ...season,
      dateTypes,
      campgrounds,
      // we want to send only the features that are not grouped by campgrounds
      features: features.filter((feature) => !feature.campground),
    };

    res.json(output);
  }),
);

// SAVING FORMS
// - save draft (operator)
// - submit for review (operator)
// - save draft (staff)
// - approve (staff)

// save draft (role determined by user)
router.post(
  "/:seasonId/save/",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
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
        // if date doesn't have ID, it's a new date
        DateRange.create({
          seasonId,
          dateableId: date.dateableId,
          dateTypeId: date.dateType.id,
          startDate: date.startDate,
          endDate: date.endDate,
        });
      }
    });

    res.sendStatus(200);
  }),
);

// approve
router.post(
  "/:seasonId/approve/",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const { notes, readyToPublish } = req.body;

    const season = await Season.findByPk(seasonId);

    if (!season) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    // create season change log
    await SeasonChangeLog.create({
      seasonId,
      userId: 1,
      notes,
      statusOldValue: season.status,
      statusNewValue: "approved",
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: readyToPublish,
    });

    // update season
    Season.update(
      {
        readyToPublish,
        status: "approved",
      },
      {
        where: {
          id: seasonId,
        },
      },
    );

    res.sendStatus(200);
  }),
);

// submit for review

// approve

// publish

export default router;
