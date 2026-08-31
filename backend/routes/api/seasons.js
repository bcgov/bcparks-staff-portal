import { Router } from "express";
import _ from "lodash";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";
import sequelize from "../../db/connection.js";
import * as STATUS from "../../constants/seasonStatus.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as FEATURE_TYPE from "../../constants/featureType.js";
import {
  getAllDateTypes,
  getDateTypesForFeature,
  getDateTypesForPark,
} from "../../utils/dateTypesHelpers.js";
import { checkSeasonUserAccess } from "../../utils/seasonHelpers.js";
import { resolveSeasonApprovalState } from "../../utils/seasonApprovalHelpers.js";

import {
  Park,
  Season,
  Feature,
  ParkArea,
  SeasonChangeLog,
  User,
} from "../../models/index.js";

import { checkPermissions } from "../../middleware/permissions.js";
import * as USER_ROLES from "../../constants/userRoles.js";

// import { createFirstComeFirstServedDateRange } from "../../utils/firstComeFirstServedHelper.js";
import propagateWinterFeeDates from "../../utils/propagateWinterFeeDates.js";
import hasOperationDateChanges from "../../utils/hasOperationDateChanges.js";
import hasWinterFeeDateChanges from "../../utils/hasWinterFeeDateChanges.js";
import checkUserRoles, {
  getRolesFromAuth,
} from "../../utils/checkUserRoles.js";

import {
  changeLogsQueryPart,
  dateableAndDatesQueryPart,
  featureTypeQueryPart,
  SEASON_ATTRIBUTES,
} from "../../utils/seasonQueryHelpers.js";
import {
  getPreviousSeasonDates,
  getDateRangeAnnuals,
  getGateDetail,
  getFrontcountryFeatureReservationDates,
  getParkDates,
  getWinterSeason,
} from "../../utils/seasonDataHelpers.js";
import {
  checkSeasonExists,
  saveSeasonData,
} from "../../utils/saveSeasonData.js";

const router = Router();

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

    // Throw a 404 if the season was not found.
    checkSeasonExists(seasonModel);
    // Throw a 403 if the user doesn't have access to the park associated with the season.
    await checkSeasonUserAccess(req, seasonId);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      featureLevel: true,
    });

    // Include all DateTypes for this Season level
    const dateTypesArray = await getAllDateTypes({
      featureLevel: true,
    });

    const dateTypesByDateTypeId = _.keyBy(dateTypesArray, "dateTypeNumber");

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

    // Add datesCanSpan2Years flag at the season level
    currentSeason.datesCanSpan2Years = feature.datesCanSpan2Years;

    const output = {
      current: currentSeason,
      previous: previousSeason,
      dateTypes: orderedDateTypes,
      icon: seasonModel.feature.featureType.icon,
      featureTypeName: seasonModel.feature.featureType.name,
      featureTypeNumber: seasonModel.feature.featureType.featureTypeNumber,
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

              where: { active: true, hasDates: true },

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

    // Throw a 404 if the season was not found.
    checkSeasonExists(seasonModel);
    // Throw a 403 if the user doesn't have access to the park associated with the season.
    await checkSeasonUserAccess(req, seasonId);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      featureLevel: true,
    });

    // Include all DateTypes for the Feature level
    const featureDateTypesArray = await getAllDateTypes({
      featureLevel: true,
    });

    const featureDateTypesByDateTypeId = _.keyBy(
      featureDateTypesArray,
      "dateTypeNumber",
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
    let featureTypeNumber = null;

    // If there are features in the Park Area, use the first feature's type
    if (seasonModel.parkArea.features.length > 0) {
      const firstFeature = seasonModel.parkArea.features[0];

      icon = firstFeature.featureType.icon;
      featureTypeName = firstFeature.featureType.name;
      featureTypeNumber = firstFeature.featureType.featureTypeNumber;
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

    // Add datesCanSpan2Years flag at the season level
    // to indicate if any features have dates that span two years
    currentSeason.datesCanSpan2Years = seasonModel.parkArea.features.some(
      (feature) => feature.datesCanSpan2Years,
    );

    const output = {
      current: currentSeason,
      previous: previousSeason,
      // Don't include any Area-level dates.
      // Area forms will only have Feature-level dates.
      areaDateTypes: [],
      featureDateTypesByFeatureId,
      icon,
      featureTypeName,
      featureTypeNumber,
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

                  where: { active: true, hasDates: true },

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
                hasDates: true,
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

    // Throw a 404 if the season was not found.
    checkSeasonExists(seasonModel);
    // Throw a 403 if the user doesn't have access to the park associated with the season.
    await checkSeasonUserAccess(req, seasonId);

    const { park } = seasonModel;

    // Add the parkArea- and feature-level Frontcountry Campground reservation dates
    // to the payload (for Tier 1 and Tier 2 validation rules)
    const frontcountryFeatureReservationDates =
      getFrontcountryFeatureReservationDates(park, seasonModel.operatingYear);

    // Get the previous year's Season Dates for this Feature
    const previousSeason = await getPreviousSeasonDates(seasonModel, {
      parkLevel: true,
    });

    // Get the current winter season for the same operating year
    const currentWinterSeason = await getWinterSeason(
      park,
      seasonModel.operatingYear,
    );

    const previousWinterSeason = await getWinterSeason(
      park,
      seasonModel.operatingYear - 1,
    );

    const previousWinterSeasonDates = previousWinterSeason?.park?.dateable
      ?.dateRanges
      ? previousWinterSeason.park.dateable.dateRanges.filter(
          (dateRange) => dateRange.startDate && dateRange.endDate, // Filter out blank ranges
        )
      : [];

    // Include all DateTypes for this Season level
    const dateTypesArray = await getAllDateTypes({
      parkLevel: true,
    });

    const dateTypesByDateTypeId = _.keyBy(dateTypesArray, "dateTypeNumber");

    // Return the DateTypes in a specific order
    const orderedDateTypes = getDateTypesForPark(
      park,
      dateTypesByDateTypeId,
      seasonModel.seasonType,
    );

    let gateDetail = null;

    // Add park gate data for regular (non-winter) seasons
    if (seasonModel.seasonType === SEASON_TYPE.REGULAR) {
      gateDetail = await getGateDetail(seasonModel.publishableId);
    }

    // Get DateRangeAnnuals and GateDetail
    const dateRangeAnnuals = await getDateRangeAnnuals(
      seasonModel.publishableId,
    );

    // Add DateRangeAnnuals to seasonModel
    const currentSeason = {
      ...seasonModel.toJSON(),
      dateRangeAnnuals,
      gateDetail,
    };

    // Add datesCanSpan2Years flag at the season level.
    // Park-level forms won't have this flag, but set it false for the template.
    // Winter season dates can span 2 years, but validation/UI logic is different for winter fees.
    currentSeason.datesCanSpan2Years = false;

    const output = {
      current: currentSeason,
      previous: previousSeason,
      currentWinter: currentWinterSeason,
      previousWinter: previousWinterSeasonDates,
      dateTypes: orderedDateTypes,
      icon: null,
      featureTypeName: null,
      featureTypeNumber: null,
      name: seasonModel.park.name,
      frontcountryFeatureReservationDates:
        await frontcountryFeatureReservationDates,
    };

    res.json(output);
  }),
);

// Get all seasons for a given publishableId and seasonType
router.get(
  "/options/:seasonId",
  asyncHandler(async (req, res) => {
    const seasonId = Number(req.params.seasonId);
    const currentYear = new Date().getFullYear();

    const currentSeason = await Season.findByPk(seasonId, {
      attributes: ["id", "publishableId", "seasonType"],
      include: [
        {
          model: Feature,
          as: "feature",
          attributes: ["featureTypeId"],
          include: [featureTypeQueryPart()],
          required: false,
        },
        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id"],
          required: false,
          include: [
            {
              model: Feature,
              as: "features",
              attributes: ["id"],
              required: false,
              include: [featureTypeQueryPart()],
            },
          ],
        },
      ],
    });

    checkSeasonExists(currentSeason);
    await checkSeasonUserAccess(req, seasonId);

    const featureTypeNumber =
      currentSeason.feature?.featureType?.featureTypeNumber;

    const hasTwoYearsAheadParkAreaFeatureType = (
      currentSeason.parkArea?.features || []
    ).some(
      (feature) =>
        feature.featureType?.featureTypeNumber ===
          FEATURE_TYPE.GROUP_CAMPGROUND ||
        feature.featureType?.featureTypeNumber === FEATURE_TYPE.PICNIC_SHELTER,
    );

    // Group site and picnic shelter dates are collected a year before campsite dates
    // because they open for reservations 12 months in advance. As a result, the highest
    // operatingYear in the database is one year ahead of the active camping season.
    const isTwoYearsAheadFeatureType =
      featureTypeNumber === FEATURE_TYPE.GROUP_CAMPGROUND ||
      featureTypeNumber === FEATURE_TYPE.PICNIC_SHELTER ||
      hasTwoYearsAheadParkAreaFeatureType;

    const requestedOperatingYear =
      currentSeason.seasonType === SEASON_TYPE.WINTER
        ? currentYear
        : currentYear + (isTwoYearsAheadFeatureType ? 2 : 1);

    const seasons = await Season.findAll({
      attributes: ["id", "operatingYear"],
      where: {
        publishableId: currentSeason.publishableId,
        seasonType: currentSeason.seasonType,
        operatingYear: {
          [Op.lt]: requestedOperatingYear,
        },
      },
      order: [["operatingYear", "DESC"]],
    });

    res.json({ seasons });
  }),
);

// Save changes from the season form
router.post(
  "/:seasonId/save/",
  checkPermissions([USER_ROLES.DOOT_SUBMITTER, USER_ROLES.DOOT_CONTRIBUTOR]),
  asyncHandler(async (req, res) => {
    const diagnostics = [];
    const seasonId = Number(req.params.seasonId);
    const {
      notes = "",
      savedWithErrors = false,
      deletedDateRangeIds = [],
      dateRangeAnnuals = [],
      gateDetail = {},
      status,
    } = req.body;
    let { readyToPublish } = req.body;

    // Disallow changing the season status to anything other than the preset statuses
    if (
      status !== STATUS.REQUESTED &&
      status !== STATUS.PENDING_REVIEW &&
      status !== STATUS.APPROVED
    ) {
      const error = new Error("Validation error: Invalid season status");

      error.status = 400;
      throw error;
    }

    // Check the user's roles from their auth data
    const userRoles = getRolesFromAuth(req.auth);
    const isApprover = checkUserRoles(userRoles, [USER_ROLES.DOOT_APPROVER]);
    const isSubmitter = checkUserRoles(userRoles, [USER_ROLES.DOOT_SUBMITTER]);

    // Check IS/RS team-specific approver roles
    const isInformationSvcApprover = checkUserRoles(userRoles, [
      USER_ROLES.INFORMATION_SVC_APPROVER,
    ]);
    const isReservationSvcApprover = checkUserRoles(userRoles, [
      USER_ROLES.RESERVATION_SVC_APPROVER,
    ]);

    // Contributors can only save drafts. If the payload is trying to set status
    // to anything other than "requested", check if the user has permission.
    if (status === STATUS.PENDING_REVIEW && !isSubmitter) {
      const error = new Error(
        "Permission denied: You do not have permission to submit this season for review.",
      );

      error.status = 403;
      throw error;
    }

    if (status === STATUS.APPROVED && !isApprover) {
      const error = new Error(
        "Permission denied: You do not have permission to approve this season for publishing.",
      );

      error.status = 403;
      throw error;
    }

    // If the user isn't an approver, they shouldn't be able to set readyToPublish
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
      const season = await Season.findByPk(seasonId, {
        transaction,
        include: [
          {
            model: Park,
            as: "park",
            attributes: ["id", "inReservationSystem"],
            required: false,
          },
          {
            model: ParkArea,
            as: "parkArea",
            attributes: ["id", "inReservationSystem"],
            required: false,
            include: [
              {
                model: Feature,
                as: "features",
                attributes: ["id", "inReservationSystem"],
                required: false,
              },
            ],
          },
          {
            model: Feature,
            as: "feature",
            attributes: ["id", "inReservationSystem"],
            required: false,
          },
        ],
      });

      // Throw a 404 if the season doesn't exist
      checkSeasonExists(season);
      // Throw a 403 if the user doesn't have access to the park associated with the season
      await checkSeasonUserAccess(req, seasonId);

      const requestedNewStatus = status ?? season.status;
      const isWinterSeason = season.seasonType === SEASON_TYPE.WINTER;
      // Load the old gate state once and reuse it for both approval decisions
      // and the season change log written later in this same transaction.
      const oldGateDetail = isWinterSeason
        ? null
        : await getGateDetail(season.publishableId);

      const { resolvedStatus, informationSvcApproved, reservationSvcApproved } =
        await resolveSeasonApprovalState({
          season,
          requestedNewStatus,
          oldGateDetail,
          gateDetail: isWinterSeason ? null : gateDetail,
          isInformationSvcApprover,
          isReservationSvcApprover,
        });

      const newStatus = resolvedStatus;

      if (requestedNewStatus !== newStatus) {
        diagnostics.push(
          `Season status changed from "${requestedNewStatus}" to "${newStatus}" based on approval rules.`,
        );
      }
      // If readyToPublish is null or undefined, set it to the current value
      const newReadyToPublish = readyToPublish ?? season.readyToPublish;
      const readyToPublishChanged = newReadyToPublish !== season.readyToPublish;

      // Check if any operation or winter fee dates have changed
      const operationDateChanged = await hasOperationDateChanges({
        seasonId: season.id,
        dateRanges,
        deletedDateRangeIds,
        transaction,
      });

      // Check if any winter fee dates have changed
      const winterFeeDateChanged = isWinterSeason
        ? await hasWinterFeeDateChanges({
            seasonId: season.id,
            dateRanges,
            deletedDateRangeIds,
            transaction,
          })
        : false;

      const shouldMarkSavedWithErrors =
        newStatus !== STATUS.REQUESTED && savedWithErrors;

      // Require an explanation note if the form is submitted with validation errors
      if (shouldMarkSavedWithErrors && !notes.trim()) {
        const error = new Error(
          "Validation error: Missing explanation note for saving with errors.",
        );

        error.status = 400;
        throw error;
      }

      // Persist the season state, dates, and related audit records to the DB
      await saveSeasonData({
        season,
        dateRanges,
        dateRangeAnnuals,
        gateDetail: isWinterSeason ? null : gateDetail,
        oldGateDetail,
        deletedDateRangeIds,
        newStatus,
        informationSvcApproved,
        reservationSvcApproved,
        newReadyToPublish,
        notes,
        savedWithErrors: shouldMarkSavedWithErrors,
        userId: req.user.id,
        transaction,
        isWinterSeason,
      });

      // Recalculate feature-level Winter fee dates only on approved saves.
      // This avoids recalculation during draft/requested/pending-review saves.
      // Also recalculate when Winter season readyToPublish changes while approved,
      // so derived feature/parkArea Winter seasons inherit the park value.
      // Intentionally exclude approved -> published-only transitions.
      const shouldSyncStateOnly =
        isWinterSeason &&
        readyToPublishChanged &&
        !operationDateChanged &&
        !winterFeeDateChanged &&
        season.status === STATUS.APPROVED;

      if (
        newStatus === STATUS.APPROVED &&
        (operationDateChanged ||
          winterFeeDateChanged ||
          season.status !== STATUS.APPROVED ||
          (isWinterSeason && readyToPublishChanged))
      ) {
        const result = await propagateWinterFeeDates(season.id, transaction, {
          syncStateOnly: shouldSyncStateOnly,
        });

        // append the result.diagnostics array to the diagnostics array
        if (result.diagnostics && result.diagnostics.length > 0) {
          diagnostics.push(...result.diagnostics);
        }
      } else {
        if (isWinterSeason && newStatus === STATUS.APPROVED) {
          diagnostics.push(
            `Winter fee dates not propagated for Season ${season.id} because conditions were not met. (oldStatus: ${season.status}, datesChanged: ${operationDateChanged || winterFeeDateChanged}, readyToPublishChanged: ${readyToPublishChanged})`,
          );
        }
      }

      await transaction.commit();

      const responsePayload = { message: "Season saved" };

      if (diagnostics.length > 0) {
        responsePayload.executionDetails = diagnostics;
      }

      res.status(200).json(responsePayload);
    } catch (error) {
      await transaction.rollback();
      throw error; // Re-throw to let global error handler catch it
    }
  }),
);

/**
 * Retrieves all changelog notes for a specific season.
 * Returns SeasonChangeLog entries sorted by most recent first.
 * GET /api/seasons/:seasonId/notes
 */
router.get(
  "/:seasonId/notes",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const season = await Season.findByPk(seasonId, {
      attributes: ["id"],
    });

    // Throw a 404 if the season doesn't exist
    checkSeasonExists(season);
    // Throw a 403 if the user doesn't have access to the park associated with the season
    await checkSeasonUserAccess(req, seasonId);

    // Fetch all changelog notes for the season
    const changeLog = await SeasonChangeLog.findAll({
      where: {
        seasonId,
        [Op.and]: sequelize.where(
          sequelize.fn("TRIM", sequelize.col("notes")),
          Op.ne,
          "",
        ),
      },
      attributes: ["id", "notes", "createdAt"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const output = changeLog.map((entry) => ({
      id: entry.id,
      note: entry.notes,
      createdAt: entry.createdAt,
      createdBy: entry.user?.name || "Unknown",
    }));

    return res.json(output);
  }),
);

export default router;
