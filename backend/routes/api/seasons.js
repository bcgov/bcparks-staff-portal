import { Router } from "express";
import _ from "lodash";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";
import sequelize from "../../db/connection.js";
import * as STATUS from "../../constants/seasonStatus.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import {
  getAllDateTypes,
  getDateTypesForFeature,
  getDateTypesForPark,
} from "../../utils/dateTypesHelpers.js";

import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  DateRangeAnnual,
  Dateable,
  GateDetail,
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

// import { createFirstComeFirstServedDateRange } from "../../utils/firstComeFirstServedHelper.js";
// import propagateWinterFeeDates from "../../utils/propagateWinterFeeDates.js";
import checkUserRoles from "../../utils/checkUserRoles.js";

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
 * @param {Transaction} [transaction] Optional Sequelize transaction object for atomic operations
 * @returns {Promise<Season>} The updated season model
 */
async function updateStatus(
  seasonId,
  status,
  readyToPublish = null,
  transaction = null,
) {
  const season = await Season.findByPk(seasonId, { transaction });

  checkSeasonExists(season);

  // Update season status
  season.status = status;

  // Update the "Ready to publish" flag if provided
  if (readyToPublish !== null) {
    season.readyToPublish = readyToPublish;
  }

  // Update the updatedAt timestamp
  season.updatedAt = new Date();

  return season.save({
    transaction,
  });
}

/**
 * Returns the previous Season's dates for a given current Season.
 * @param {Season} currentSeason The current season object with operatingYear and publishableId
 * @param {Object} dateTypeWhere Optional where clause for filtering DateTypes
 * @returns {Array} Array with any DateRanges from the previous Season
 */
async function getPreviousSeasonDates(currentSeason, dateTypeWhere = {}) {
  try {
    // @TODO: the previous season dates here are not the same as the /park endpoint
    const prevSeason = await Season.findOne({
      where: {
        operatingYear: currentSeason.operatingYear - 1,
        publishableId: currentSeason.publishableId,
      },
      include: [
        {
          model: DateRange,
          as: "dateRanges",
          required: false,

          include: [
            {
              model: DateType,
              as: "dateType",
              required: false,
              attributes: ["id", "strapiDateTypeId", "name"],

              // Filter DateTypes by level
              where: dateTypeWhere,
            },
          ],
        },
      ],
    });

    // If no previous season exists in the DB, return an empty array
    if (!prevSeason) return [];

    return prevSeason.dateRanges;
  } catch (error) {
    console.error("Error fetching previous season:", error);
    throw error;
  }
}

/**
 * Returns all DateRangeAnnuals for a given publishableId.
 * @param {number} publishableId The ID of the Publishable to get DateRange
 * @returns {Promise<Array>} An array of DateRangeAnnual models with their DateType
 */
async function getDateRangeAnnuals(publishableId) {
  if (!publishableId) return [];
  return await DateRangeAnnual.findAll({
    where: { publishableId },
    attributes: ["id", "dateableId", "isDateRangeAnnual"],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "strapiDateTypeId", "name"],
      },
    ],
  });
}

/**
 * Returns all GateDetails for a given publishableId.
 * @param {number} publishableId The ID of the Publishable to get GateDetail
 * @returns {Promise<Object|null>} GateDetail model, or null if not found
 */
async function getGateDetail(publishableId) {
  if (!publishableId) return null;
  return await GateDetail.findOne({
    where: { publishableId },
    attributes: [
      "id",
      "hasGate",
      "gateOpenTime",
      "gateCloseTime",
      "gateOpensAtDawn",
      "gateClosesAtDusk",
    ],
  });
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
    attributes: ["id", "startDate", "endDate", "dateTypeId", "dateableId"],
    where: {
      seasonId,
    },
    required: false,
    order: [["startDate", "ASC"]], // @TODO: This doesn't work?
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "strapiDateTypeId", "name"],
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
    attributes: ["id", "name", "icon"],
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

/**
 * Returns all reservation feature dates for a specific park and operating year.
 * @param {Object} park Park model with features and parkAreas
 * @param {number} operatingYear Operating year for the Seasons
 * @returns {Promise<Array>} - Array of reservation feature dates
 */
async function getFeatureReservationDates(park, operatingYear) {
  // Only fetch dates if the park has Winter fee dates or either Tier 1 or Tier 2 dates.
  // This data is needed for Winter/Tier date validation.
  if (!(park.hasWinterFeeDates || park.hasTier1Dates || park.hasTier2Dates))
    return [];

  // Get the ID of the applicable Reservation date type
  const reservationDateType = await DateType.findOne({
    attributes: ["id"],

    where: {
      name: "Reservation",
    },
  });

  const featurePublishableIds = park.features
    // Filter out any park features without Publishable IDs
    .filter((feature) => feature.publishableId)
    .map((feature) => feature.publishableId);

  const areaFeaturePublishableIds = park.parkAreas
    // Filter out any park areas without Publishable IDs
    .filter((parkArea) => parkArea.publishableId)
    .map((parkArea) => parkArea.publishableId);

  // Query the Season IDs for each publishable Feature in the Park,
  // so we can look up their DateRanges
  const featureSeasons = await Season.findAll({
    attributes: ["id"],

    where: {
      operatingYear,

      publishableId: {
        [Op.in]: [...featurePublishableIds, ...areaFeaturePublishableIds],
      },
    },
  });

  const featureSeasonIds = featureSeasons.map((season) => season.id);

  // Get all Reservation DateRanges for these Seasons
  const reservationDateRanges = await DateRange.findAll({
    where: {
      seasonId: {
        [Op.in]: featureSeasonIds,
      },
      dateTypeId: reservationDateType.id,
    },
  });

  // Filter out blank date ranges (null startDate and endDate) and return
  return reservationDateRanges.filter(
    (dateRange) => dateRange.startDate && dateRange.endDate,
  );
}

/**
 * Returns Tier 1, Tier 2, and Winter fee dates for Park Season.
 * @param {Object} park Park model with hasTier1Dates, hasTier2Dates, and publishableId
 * @param {number} operatingYear Operating year for the Seasons
 * @returns {Promise<Object>} - Object with parkTier1Dates, parkTier2Dates, and parkWinterDates arrays
 */
async function getParkDates(park, operatingYear) {
  // Get the Park Season for the operating year
  const parkSeason = await Season.findOne({
    where: {
      publishableId: park.publishableId,
      operatingYear,
    },

    include: [
      {
        model: DateRange,
        as: "dateRanges",
        required: false,

        include: [
          {
            model: DateType,
            as: "dateType",
            attributes: ["id", "strapiDateTypeId", "name"],
          },
        ],
      },
    ],
  });

  // Handle case where no park season exists
  if (!parkSeason) {
    return {
      parkTier1Dates: [],
      parkTier2Dates: [],
      parkWinterDates: [],
    };
  }

  // Filter out blank date ranges (null startDate and endDate)
  const dateRanges = parkSeason.dateRanges.filter(
    (range) => range.startDate && range.endDate,
  );

  // Group DateRanges by Type and get the Tier 1 and Tier 2 dates, if any
  const datesByType = _.groupBy(dateRanges, "dateType.name");

  const {
    "Tier 1": tier1Dates = [],
    "Tier 2": tier2Dates = [],
    "Winter fee": parkWinterDates = [],
  } = datesByType;

  // Only include tier dates if park supports them
  const parkTier1Dates = park.hasTier1Dates ? tier1Dates : [];
  const parkTier2Dates = park.hasTier2Dates ? tier2Dates : [];

  return {
    parkTier1Dates,
    parkTier2Dates,
    parkWinterDates,
  };
}

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
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      featureLevel: true,
    });

    // Include all DateTypes for this Season level
    const dateTypesArray = await getAllDateTypes({
      featureLevel: true,
    });

    const dateTypesByDateTypeId = _.keyBy(dateTypesArray, "strapiDateTypeId");

    const { feature } = seasonModel;

    // Add some Park-level dates to the payload
    // (for validation rules)
    const parkDates = getParkDates(feature.park, seasonModel.operatingYear);
    // Also fetch Park-level dates for the previous season (for Winter fees)
    const previousParkDates = getParkDates(
      feature.park,
      seasonModel.operatingYear - 1,
    );

    // Return the DateTypes in a specific order
    const orderedDateTypes = getDateTypesForFeature(
      feature,
      dateTypesByDateTypeId,
    );

    // Get DateRangeAnnuals and GateDetail
    const dateRangeAnnuals = await getDateRangeAnnuals(
      seasonModel.publishableId,
    );
    const gateDetail = await getGateDetail(seasonModel.publishableId);

    // Add DateRangeAnnuals to seasonModel
    const currentSeason = {
      ...seasonModel.toJSON(),
      dateRangeAnnuals,
      gateDetail,
    };

    // Combine current and previous Park-level winter fee dates
    const { parkWinterDates, ...otherParkDates } = await parkDates;
    const previousParkWinterDates = (await previousParkDates).parkWinterDates;

    parkWinterDates.push(...previousParkWinterDates);

    const output = {
      current: currentSeason,
      previous: previousSeason,
      dateTypes: orderedDateTypes,
      icon: seasonModel.feature.featureType.icon,
      featureTypeName: seasonModel.feature.featureType.name,
      name: seasonModel.feature.name,
      parkName: seasonModel.feature.park.name,
      parkWinterDates,
      ...otherParkDates,
    };

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

              where: {
                active: true,
              },

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
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      [Op.or]: [{ parkAreaLevel: true }, { featureLevel: true }],
    });

    // Include all DateTypes for the Feature level
    const featureDateTypesArray = await getAllDateTypes({
      featureLevel: true,
    });

    const featureDateTypesByDateTypeId = _.keyBy(
      featureDateTypesArray,
      "strapiDateTypeId",
    );

    // Add some Park-level dates to the payload
    // (for validation rules)
    const parkDates = getParkDates(
      seasonModel.parkArea.park,
      seasonModel.operatingYear,
    );
    // Also fetch Park-level dates for the previous season (for Winter fees)
    const previousParkDates = getParkDates(
      seasonModel.parkArea.park,
      seasonModel.operatingYear - 1,
    );

    // Return the DateTypes in a specific order for each feature, keyed by ID
    const orderedFeatureDateTypesEntries = seasonModel.parkArea.features.map(
      (feature) => [
        feature.id,
        getDateTypesForFeature(feature, featureDateTypesByDateTypeId),
      ],
    );

    const featureDateTypesByFeatureId = Object.fromEntries(
      orderedFeatureDateTypesEntries,
    );

    let icon = null;
    let featureTypeName = null;

    // If there are features in the Park Area, use the first feature's type
    if (seasonModel.parkArea.features.length > 0) {
      const firstFeature = seasonModel.parkArea.features[0];

      icon = firstFeature.featureType.icon;
      featureTypeName = firstFeature.featureType.name;
    }

    // Get DateRangeAnnuals and GateDetail
    const dateRangeAnnuals = await getDateRangeAnnuals(
      seasonModel.publishableId,
    );
    const gateDetail = await getGateDetail(seasonModel.publishableId);

    // Add DateRangeAnnuals to seasonModel
    const currentSeason = {
      ...seasonModel.toJSON(),
      dateRangeAnnuals,
      gateDetail,
    };

    // Combine current and previous Park-level winter fee dates
    const { parkWinterDates, ...otherParkDates } = await parkDates;
    const previousParkWinterDates = (await previousParkDates).parkWinterDates;

    parkWinterDates.push(...previousParkWinterDates);

    const output = {
      current: currentSeason,
      previous: previousSeason,
      // Don't include any Area-level dates.
      // Area forms will only have Feature-level dates.
      areaDateTypes: [],
      featureDateTypesByFeatureId,
      icon,
      featureTypeName,
      name: seasonModel.parkArea.name,
      parkName: seasonModel.parkArea.park.name,
      parkWinterDates,
      ...otherParkDates,
    };

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

                  where: {
                    active: true,
                  },

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
                active: true,
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

    const { park } = seasonModel;

    // Add the parkArea- and feature-level reservation dates to the payload
    // (for Tier 1 and Tier 2 validation rules)
    const featureReservationDates = getFeatureReservationDates(
      park,
      seasonModel.operatingYear,
    );

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      parkLevel: true,
    });

    // Include all DateTypes for this Season level
    const dateTypesArray = await getAllDateTypes({
      parkLevel: true,
    });

    const dateTypesByDateTypeId = _.keyBy(dateTypesArray, "strapiDateTypeId");

    // Return the DateTypes in a specific order
    const orderedDateTypes = getDateTypesForPark(park, dateTypesByDateTypeId);

    // Add Park gate open date type
    // @TODO: This should be in its own property
    // because it's used by gate details and not the Reservations section
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.PARK_GATE_OPEN]);

    // Get DateRangeAnnuals and GateDetail
    const dateRangeAnnuals = await getDateRangeAnnuals(
      seasonModel.publishableId,
    );
    const gateDetail = await getGateDetail(seasonModel.publishableId);

    // Add DateRangeAnnuals to seasonModel
    const currentSeason = {
      ...seasonModel.toJSON(),
      dateRangeAnnuals,
      gateDetail,
    };

    const output = {
      current: currentSeason,
      previous: previousSeason,
      dateTypes: orderedDateTypes,
      icon: null,
      featureTypeName: null,
      name: seasonModel.park.name,
      featureReservationDates: await featureReservationDates,
    };

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
      deletedDateRangeIds = [],
      dateRangeAnnuals = [],
      gateDetail = {},
      status,
    } = req.body;
    let { readyToPublish } = req.body;

    // If the user isn't an approver, they shouldn't be able to set readyToPublish
    const isApprover = checkUserRoles(req.auth, ["doot-approver"]);

    if (!isApprover) {
      // Clear the value from the request body
      // This will prevent the user from changing readyToPublish
      readyToPublish = null;
    }

    const transaction = await sequelize.transaction();

    // Add seasonId to dateRanges
    const dateRangePayload = req.body.dateRanges || [];
    const dateRanges = dateRangePayload.map((dateRange) => ({
      ...dateRange,
      seasonId,
    }));

    try {
      // Check if the season exists
      const season = await Season.findByPk(seasonId, { transaction });

      checkSeasonExists(season);

      const newStatus = status ?? season.status;

      // If readyToPublish is null or undefined, set it to the current value
      const newReadyToPublish = readyToPublish ?? season.readyToPublish;

      // dateRangeAnnuals
      const dateRangeAnnualsToSave = (dateRangeAnnuals || []).map(
        (dateRangeAnnual) => ({
          id: dateRangeAnnual.id,
          dateTypeId: dateRangeAnnual.dateType?.id,
          publishableId: season.publishableId,
          dateableId: dateRangeAnnual.dateableId,
          isDateRangeAnnual: dateRangeAnnual.isDateRangeAnnual,
        }),
      );

      // Upsert dateRangeAnnuals
      const saveDateRangeAnnuals = DateRangeAnnual.bulkCreate(
        dateRangeAnnualsToSave,
        {
          updateOnDuplicate: ["isDateRangeAnnual", "updatedAt"],
          transaction,
        },
      );

      // gateDetail
      const oldGateDetail = await getGateDetail(season.publishableId);

      const gateDetailToSave = {
        ...gateDetail,
        publishableId: season.publishableId,
      };

      // Upsert gateDetail
      const saveGateDetail = GateDetail.upsert(gateDetailToSave, {
        transaction,
      });

      // Create season change log with the notes
      const seasonChangeLog = await SeasonChangeLog.create(
        {
          seasonId,
          userId: req.user.id,
          notes,
          statusOldValue: season.status,
          statusNewValue: newStatus,
          readyToPublishOldValue: season.readyToPublish,
          readyToPublishNewValue: newReadyToPublish,
          gateDetailOldValue: oldGateDetail,
          gateDetailNewValue: gateDetailToSave,
        },
        { transaction },
      );

      // Update the season object with the new status and readyToPublish values
      const saveSeason = updateStatus(
        seasonId,
        newStatus,
        readyToPublish,
        transaction,
      );

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

        transaction,
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

      const createChangeLogs = DateChangeLog.bulkCreate(changeLogsToCreate, {
        transaction,
      });

      // Update or create dateRanges
      const updateDates = DateRange.bulkCreate(dateRanges, {
        updateOnDuplicate: ["startDate", "endDate", "updatedAt"],

        transaction,
      });

      // Delete dateRanges removed by the user
      const deleteDates = DateRange.destroy({
        where: {
          id: {
            [Op.in]: deletedDateRangeIds,
          },
        },

        transaction,
      });

      await Promise.all([
        saveSeason,
        updateDates,
        createChangeLogs,
        deleteDates,
        saveDateRangeAnnuals,
        saveGateDetail,
      ]);

      await transaction.commit();
      res.sendStatus(200);
    } catch (error) {
      await transaction.rollback();
      throw error; // Re-throw to let global error handler catch it
    }
  }),
);

// Approve
router.post(
  "/:seasonId/approve/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    const transaction = await sequelize.transaction();

    try {
      await updateStatus(seasonId, STATUS.APPROVED, null, transaction);

      // @TODO: Uncomment after revising the logic for FCFS
      // await createFirstComeFirstServedDateRange(seasonId, transaction);

      // Copy Winter fee dates from the Park level to Features and Park Areas
      // @TODO: Uncomment after revising the logic for Winter fees
      // await propagateWinterFeeDates(seasonId, transaction);

      await transaction.commit();
      res.sendStatus(200);
    } catch (error) {
      await transaction.rollback();
      throw error; // Re-throw to let global error handler catch it
    }
  }),
);

// Submit for review
router.post(
  "/:seasonId/submit/",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);

    await updateStatus(seasonId, STATUS.PENDING_REVIEW);

    res.sendStatus(200);
  }),
);

export default router;
