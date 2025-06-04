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

import { createFirstComeFirstServedDateRange } from "../../utils/firstComeFirstServedHelper.js";

const router = Router();

/**
 * Checks if a Season exists, and throws an error if the Season is not found.
 * @param {Season} season The Season model instance to check
 * @throws {Error} If the Season is not found, an error with status 404 is thrown
 * @returns {boolean} Returns true if the Season exists
 */
function checkSeasonExists(season) {
  if (season) return true;

  const error = new Error("Season not found");

  error.status = 404;
  throw error;
}

/**
 * Updates the status of a Season.
 * If "save" is true, it will first save the changes to the Season.
 * @param {number} seasonId The ID of the season to update
 * @param {string} status The new status to set for the season
 * @param {boolean} [readyToPublish] Optionally provide a new readyToPublish value to set
 * @returns {Promise<Season>} The updated season model
 */
async function updateStatus(seasonId, status, readyToPublish = null) {
  const season = await Season.findByPk(seasonId);

  checkSeasonExists(season);

  // Update season status
  season.status = status;

  // Update the "Ready to publish" flag if provided
  if (readyToPublish !== null) {
    season.readyToPublish = readyToPublish;
  }

  return season.save();
}

/**
 * Returns the previous Season's dates for a given current Season.
 * @param {Season} currentSeason The current season object with operatingYear and publishableId
 * @returns {Season} The previous season model with its Dateable and DateRanges
 */
async function getPreviousSeasonDates(currentSeason) {
  try {
    return await Season.findOne({
      where: {
        operatingYear: currentSeason.operatingYear - 1,
        publishableId: currentSeason.publishableId,
      },
      include: [
        {
          model: DateRange,
          as: "dateRanges",
          required: false,
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching previous season:", error);
    return null;
  }
}

/**
 * Returns a query part for including change logs associated with a Season.
 * @returns {Object} Sequelize query part for fetching change logs
 */
function changeLogsQueryPart() {
  return {
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
  };
}

/**
 * Returns a query part for including DateRanges associated with a Season.
 * @param {number} seasonId the ID of the DateRanges' Season
 * @returns {Object} Sequelize query part for fetching DateRanges
 */
function dateRangesQueryPart(seasonId) {
  return {
    model: DateRange,
    as: "dateRanges",
    attributes: ["id", "startDate", "endDate"],
    where: {
      seasonId,
    },
    required: false,
    order: [["startDate", "ASC"]],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "name"],
      },
    ],
  };
}

/**
 * Returns a query part for including a Dateable and its DateRanges.
 * @param {number} seasonId the ID of the DateRanges' Season
 * @returns {Object} Sequelize query part for fetching Dateable and its DateRanges
 */
function dateableAndDatesQueryPart(seasonId) {
  return {
    model: Dateable,
    as: "dateable",
    include: [dateRangesQueryPart(seasonId)],
  };
}

/**
 * Returns a query part for including FeatureType details with a Feature.
 * @returns {Object} Sequelize query part for fetching FeatureType details
 */
function featureTypeQueryPart() {
  return {
    model: FeatureType,
    as: "featureType",
    attributes: ["id", "name"],
  };
}

// Common attributes for all Season queries
const SEASON_ATTRIBUTES = [
  "id",
  "operatingYear",
  "status",
  "readyToPublish",
  "editable",
  "publishableId",
];

// Get all form data and DateRanges for a Feature Season
router.get(
  "/feature/:seasonId",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: SEASON_ATTRIBUTES,
      include: [
        // Feature details
        {
          model: Feature,
          as: "feature",
          include: [
            featureTypeQueryPart(),

            // Park Area, if any
            {
              model: ParkArea,
              as: "parkArea",
              attributes: ["id", "name"],
              required: false,
            },

            // Park details
            {
              model: Park,
              as: "park",
            },

            // Dates for this Feature Season
            dateableAndDatesQueryPart(seasonId),
          ],
        },

        changeLogsQueryPart(),
      ],
    });

    checkSeasonExists(seasonModel);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel);

    const output = { current: seasonModel, previous: previousSeason };

    res.json(output);
  }),
);

// Get all form data and DateRanges for a ParkArea Season
router.get(
  "/park-area/:seasonId",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: SEASON_ATTRIBUTES,
      include: [
        // Park Area details
        {
          model: ParkArea,
          as: "parkArea",
          include: [
            {
              model: Park,
              as: "park",
            },

            // Dates for this Park Area Season
            dateableAndDatesQueryPart(seasonId),

            {
              model: Feature,
              as: "features",
              include: [
                featureTypeQueryPart(),

                // Dates for this Feature Season
                dateableAndDatesQueryPart(seasonId),
              ],
            },
          ],
        },

        changeLogsQueryPart(),
      ],
    });

    checkSeasonExists(seasonModel);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel);

    const output = { current: seasonModel, previous: previousSeason };

    res.json(output);
  }),
);

// Get all form data and DateRanges for a Park Season
router.get(
  "/park/:seasonId",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: SEASON_ATTRIBUTES,
      include: [
        // Park Area details
        {
          model: Park,
          as: "park",

          include: [
            // Park-level dates
            // Dates for this Park Season
            dateableAndDatesQueryPart(seasonId),

            // Park Areas for this Park Season
            {
              model: ParkArea,
              as: "parkAreas",
              required: false,
              include: [
                // Dates for this Park Area Season
                dateableAndDatesQueryPart(seasonId),

                {
                  model: Feature,
                  as: "features",
                  include: [
                    featureTypeQueryPart(),

                    // Dates for this Feature Season
                    dateableAndDatesQueryPart(seasonId),
                  ],
                },
              ],
            },

            // Features that aren't in a Park Area
            {
              model: Feature,
              as: "features",
              where: {
                parkAreaId: null, // Only get Features not in a Park Area
              },
              required: false,
              include: [
                featureTypeQueryPart(),

                // Dates for this Feature Season
                dateableAndDatesQueryPart(seasonId),
              ],
            },
          ],
        },

        changeLogsQueryPart(),
      ],
    });

    checkSeasonExists(seasonModel);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel);

    const output = { current: seasonModel, previous: previousSeason };

    res.json(output);
  }),
);

// Save draft
router.post(
  "/:seasonId/save/",
  sanitizePayload,
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);
    const {
      notes = "",
      dateRanges = [],
      deletedDateRangeIds = [],
      readyToPublish,
    } = req.body;

    // Check if the season exists
    const season = await Season.findByPk(seasonId, {});

    checkSeasonExists(season);

    const newStatus = "requested";

    // Create season change log with the notes
    const seasonChangeLog = await SeasonChangeLog.create({
      seasonId,
      userId: req.user.id,
      notes,
      statusOldValue: season.status,
      statusNewValue: newStatus,
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: readyToPublish,
    });

    // Update the season object with the new status and readyToPublish values
    const saveSeason = updateStatus(seasonId, newStatus, readyToPublish);

    // Create date change logs for updated dateRanges
    const existingDateIds = dateRanges
      .filter((date) => date.id)
      .map((date) => date.id);
    const existingDateRows = await DateRange.findAll({
      where: {
        id: {
          [Op.in]: existingDateIds,
        },
      },
    });

    const datesToUpdateByid = _.keyBy(dateRanges, "id");
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
    const updateDates = DateRange.bulkCreate(dateRanges, {
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

// Approve
router.post(
  "/:seasonId/approve/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    const season = await updateStatus(seasonId, "approved");

    // Create "First come, first served" DateRange if applicable
    await createFirstComeFirstServedDateRange(season);

    res.sendStatus(200);
  }),
);

// Submit for review
router.post(
  "/:seasonId/submit/",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    await updateStatus(seasonId, "pending review");

    res.sendStatus(200);
  }),
);

export default router;
