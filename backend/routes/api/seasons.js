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
  ParkArea,
  SeasonChangeLog,
  DateChangeLog,
  User,
} from "../../models/index.js";

import {
  adminsAndApprovers,
  checkPermissions,
  sanitizePayload,
} from "../../middleware/permissions.js";

import { createFirstComeFirstServedDateRange } from "../utils/dateHelper.js";

const router = Router();

// function getNewStatusForSeason(season, user) {
//   // this will depend on the user's role
//   // rn we're just setting everything to requested
//   // For staff
//   //   requested -- > requested
//   //   pending review -- > pending review
//   //   approved -- > pending review
//   //   on API --> pending review
//   // For operator
//   //   requested -- > requested
//   //   pending review -- > requested
//   //   approved -- > requested
//   //   on API --> requested
//   return season.status;
// }

router.get(
  "/:seasonId",
  asyncHandler(async (req, res) => {
    // @TODO: Reimplement this endpoint to use the publishable model
    const error = new Error("Not implemented yet");

    error.status = 501;
    throw error;

    const { seasonId } = req.params;

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: [
        "id",
        "operatingYear",
        "status",
        "readyToPublish",
        "editable",
      ],
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
          model: ParkArea,
          as: "parkArea",
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

    // add datetypes from the db to map
    const dateTypesFromDb = await DateType.findAll({
      attributes: ["id", "name", "description"],
      where: {
        name: {
          [Op.in]: ["Operation", "Reservation"],
        },
      },
    });

    dateTypesFromDb.forEach((dateType) => {
      dateTypes[dateType.name] = dateType.toJSON();
    });

    let features = parkFeatures.map((featureObj) => {
      const feature = featureObj.toJSON();

      // each feature will have an array of date ranges for the current season and the previous season
      // we'll remove the dateRanges array and add currentSeasonDates and previousSeasonDates arrays
      // so that the client can easily sort them
      feature.dateable.currentSeasonDates = [];
      feature.dateable.previousSeasonDates = [];

      feature.dateable.dateRanges = _.orderBy(
        feature.dateable.dateRanges,
        "startDate",
      );

      feature.dateable.dateRanges.forEach((dateRange) => {
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

    // Order features alphabetically before grouping by parkArea
    features = _.orderBy(features, ["name"], ["asc"]);

    const parkAreasMap = {};

    // some features are grouped by parkAreas
    // we want to assign each feature to the respective parkArea if it exists
    features.forEach((feature) => {
      if (feature.parkArea) {
        if (!parkAreasMap[feature.parkArea.id]) {
          parkAreasMap[feature.parkArea.id] = {
            id: feature.parkArea.id,
            name: feature.parkArea.name,
            features: [],
          };
        }

        parkAreasMap[feature.parkArea.id].features.push({
          ...feature,
          name: feature.name === "All sites" ? "" : feature.name,
        });
      }
    });

    const parkAreas = Object.values(parkAreasMap);

    const output = {
      ...season,
      dateTypes,
      parkAreas,
      // we want to send only the features that are not grouped by parkAreas
      features: features.filter((feature) => !feature.parkArea),
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
  sanitizePayload,
  asyncHandler(async (req, res) => {
    // @TODO: Reimplement this endpoint to use the publishable model
    const error = new Error("Not implemented yet");

    error.status = 501;
    throw error;

    const seasonId = Number(req.params.seasonId);
    const { notes, dates, deletedDateRangeIds = [] } = req.body;

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

    // If no readyToPublish is provided, treat it as unchanged
    const readyToPublish = req.body.readyToPublish ?? season.readyToPublish;

    // create season change log
    const seasonChangeLog = await SeasonChangeLog.create({
      seasonId,
      userId: req.user.id,
      notes,
      statusOldValue: season.status,
      statusNewValue: "requested",
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: readyToPublish,
    });

    // Update season
    const saveSeason = Season.update(
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

    // Create date change logs for updated dateRanges
    const existingDateIds = dates
      .filter((date) => date.id)
      .map((date) => date.id);
    const existingDateRows = await DateRange.findAll({
      where: {
        id: {
          [Op.in]: existingDateIds,
        },
      },
    });

    const datesToUpdateByid = _.keyBy(dates, "id");
    const changeLogsToCreate = existingDateRows.map((oldDateRange) => {
      const newDateRange = datesToUpdateByid[oldDateRange.id];

      return {
        dateRangeId: oldDateRange.id,
        seasonChangeLogId: seasonChangeLog.id,
        startDateOldValue: oldDateRange.startDate,
        startDateNewValue: newDateRange.startDate,
        endDateOldValue: oldDateRange.endDate,
        endDateNewValue: newDateRange.endDate,
      };
    });

    const createChangeLogs = DateChangeLog.bulkCreate(changeLogsToCreate);

    // Update or create dateRanges
    const updateDates = DateRange.bulkCreate(dates, {
      updateOnDuplicate: ["startDate", "endDate", "updatedAt"],
    });

    // Delete dateRanges removed by the user
    const deleteDates = DateRange.destroy({
      where: {
        id: {
          [Op.in]: deletedDateRangeIds,
        },
      },
    });

    await Promise.all([saveSeason, updateDates, createChangeLogs, deleteDates]);

    res.sendStatus(200);
  }),
);

// approve
router.post(
  "/:seasonId/approve/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const { notes, readyToPublish } = req.body;

    const season = await Season.findByPk(seasonId, {
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
        },
        {
          model: DateRange,
          as: "dateRanges",
          attributes: ["id", "startDate", "endDate", "dateTypeId"],
          include: [
            {
              model: DateType,
              as: "dateType",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!season) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    // Create "First come, first served" DateRange if applicable
    await createFirstComeFirstServedDateRange(season);

    // Approving a season can have more than one note
    // if the approved season has some empty dates
    const notesToCreate = notes
      .filter((n) => n !== "")
      .map((note) => ({
        seasonId,
        userId: req.user.id,
        notes: note,
        statusOldValue: season.status,
        statusNewValue: "approved",
        readyToPublishOldValue: season.readyToPublish,
        readyToPublishNewValue: readyToPublish,
      }));

    // bulk create season change logs
    SeasonChangeLog.bulkCreate(notesToCreate);

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
router.post(
  "/:seasonId/submit-for-approval/",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const { notes } = req.body;

    const season = await Season.findByPk(seasonId);

    if (!season) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    // Submitting a season for review can have more than one note
    // if the approved season has some empty dates
    const notesToCreate = notes
      .filter((n) => n !== "")
      .map((note) => ({
        seasonId,
        userId: req.user.id,
        notes: note,
        statusOldValue: season.status,
        statusNewValue: "pending review",
        // Treat it as unchanged: submitters can't change readyToPublish
        readyToPublishOldValue: season.readyToPublish,
        readyToPublishNewValue: season.readyToPublish,
      }));

    // bulk create season change logs
    SeasonChangeLog.bulkCreate(notesToCreate);

    // update season
    Season.update(
      {
        status: "pending review",
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

// publish

export default router;
