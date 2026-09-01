import _ from "lodash";
import { Op } from "sequelize";
import * as DATE_TYPE from "../constants/dateType.js";
import {
  Season,
  DateRange,
  DateRangeAnnual,
  GateDetail,
  SeasonChangeLog,
  DateChangeLog,
  DateType,
} from "../models/index.js";

/**
 * Checks if a Season exists, and throws an error if the Season is not found.
 * @param {Season} season The Season model instance to check
 * @throws {Error} If the Season is not found, an error with status 404 is thrown
 * @returns {boolean} Returns true if the Season exists
 */
export function checkSeasonExists(season) {
  if (season) return true;

  const error = new Error("Season not found");

  error.status = 404;
  throw error;
}

/**
 * Updates the status of a Season.
 * @param {number} seasonId The ID of the season to update
 * @param {string} status The new status to set for the season
 * @param {boolean} savedWithErrors Whether the form was submitted with validation errors
 * @param {Object} [options={}] Optional season state updates
 * @param {boolean} [options.readyToPublish=null] New readyToPublish value to set; pass null to leave the existing value unchanged
 * @param {boolean} [options.informationSvcApproved=null] New Information Services approval value; pass null to leave the existing value unchanged
 * @param {boolean} [options.reservationSvcApproved=null] New Reservation Services approval value; pass null to leave the existing value unchanged
 * @param {Transaction} [options.transaction=null] Optional Sequelize transaction object for atomic operations
 * @returns {Promise<Season>} The updated season model
 */
export async function updateStatus(
  seasonId,
  status,
  savedWithErrors,
  {
    readyToPublish = null,
    informationSvcApproved = null,
    reservationSvcApproved = null,
    transaction = null,
  } = {},
) {
  const season = await Season.findByPk(seasonId, { transaction });

  checkSeasonExists(season);

  // Update season status
  season.status = status;

  // Update the "savedWithErrors" flag
  season.savedWithErrors = savedWithErrors;

  // Update the "Ready to publish" flag if provided
  if (readyToPublish !== null) {
    season.readyToPublish = readyToPublish;
  }

  if (informationSvcApproved !== null) {
    season.informationSvcApproved = informationSvcApproved;
  }

  if (reservationSvcApproved !== null) {
    season.reservationSvcApproved = reservationSvcApproved;
  }

  // Update the updatedAt timestamp
  season.updatedAt = new Date();

  return season.save({
    transaction,
  });
}

/**
 * Saves season data (regular or winter season)
 * @param {Object} params Parameters for saving season data
 * @param {Season} params.season The season model instance
 * @param {Array} params.dateRanges Array of date ranges to save
 * @param {Array} params.dateRangeAnnuals Array of date range annuals to save
 * @param {Object|null} params.gateDetail Gate detail object (null for winter seasons)
 * @param {Object|null} params.oldGateDetail Existing gate detail object before save
 * @param {Array} params.deletedDateRangeIds Array of date range IDs to delete
 * @param {string} params.newStatus New status for the season
 * @param {boolean} params.informationSvcApproved Resolved Information Services team approval value, passed through to updateStatus unchanged
 * @param {boolean} params.reservationSvcApproved Resolved Reservation Services team approval value, passed through to updateStatus unchanged
 * @param {boolean|null} params.newReadyToPublish New readyToPublish value
 * @param {string} params.notes Notes for the change log
 * @param {boolean} params.savedWithErrors Whether the form was submitted with validation errors
 * @param {number} params.userId User ID making the changes
 * @param {Transaction} params.transaction Database transaction
 * @param {boolean} params.isWinterSeason Whether this is a winter season
 * @returns {Promise<void>}
 */
export async function saveSeasonData({
  season,
  dateRanges,
  dateRangeAnnuals,
  gateDetail,
  oldGateDetail,
  deletedDateRangeIds,
  newStatus,
  informationSvcApproved,
  reservationSvcApproved,
  newReadyToPublish,
  notes,
  savedWithErrors,
  userId,
  transaction,
  isWinterSeason = false,
}) {
  // Calculate the actual new readyToPublish value
  const actualNewReadyToPublish = newReadyToPublish ?? season.readyToPublish;

  // Get the Winter Fee DateType's database ID
  const winterFeeDateType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.WINTER_FEE,
    },
    transaction,
  });

  if (!winterFeeDateType) {
    throw new Error("Required DateType WINTER_FEE not found in the database.");
  }

  const winterFeeDateTypeId = winterFeeDateType.id;

  // Filter date ranges based on season type
  // Winter seasons should only have Winter fee dates
  // Regular seasons should NOT have Winter fee dates
  const filteredDateRanges = (dateRanges || []).filter((dateRange) => {
    if (!dateRange.dateTypeId) return true;

    if (isWinterSeason) {
      return dateRange.dateTypeId === winterFeeDateTypeId;
    }

    return dateRange.dateTypeId !== winterFeeDateTypeId;
  });

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

  // Handle gateDetail for regular seasons only
  let saveGateDetail = Promise.resolve();
  let gateDetailToSave = null;

  if (!isWinterSeason && gateDetail) {
    gateDetailToSave = {
      ...gateDetail,
      // If gateDetail was created between form load and submission, reuse the existing id for upsert.
      id: gateDetail?.id ?? oldGateDetail?.id,
      publishableId: season.publishableId,
    };

    saveGateDetail = GateDetail.upsert(gateDetailToSave, {
      transaction,
    });
  }

  // Create season change log with the notes
  const seasonChangeLog = await SeasonChangeLog.create(
    {
      seasonId: season.id,
      userId,
      notes,
      statusOldValue: season.status,
      statusNewValue: newStatus,
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: actualNewReadyToPublish,
      gateDetailOldValue: oldGateDetail,
      gateDetailNewValue: gateDetailToSave,
    },
    { transaction },
  );

  // Update the season object with the new status and readyToPublish values
  const saveSeason = updateStatus(season.id, newStatus, savedWithErrors, {
    readyToPublish: newReadyToPublish,
    informationSvcApproved,
    reservationSvcApproved,
    transaction,
  });

  // Create date change logs for updated dateRanges
  const existingDateIds = filteredDateRanges
    .filter((date) => date.id)
    .map((date) => date.id);

  let createChangeLogs = Promise.resolve();

  if (existingDateIds.length > 0) {
    const existingDateRows = await DateRange.findAll({
      where: {
        id: {
          [Op.in]: existingDateIds,
        },
      },
      transaction,
    });

    const datesToUpdateById = _.keyBy(filteredDateRanges, "id");
    const changeLogsToCreate = existingDateRows.map((oldDateRange) => {
      const newDateRange = datesToUpdateById[oldDateRange.id];

      return {
        dateRangeId: oldDateRange.id,
        seasonChangeLogId: seasonChangeLog.id,
        startDateOldValue: oldDateRange.startDate,
        startDateNewValue: newDateRange.startDate,
        endDateOldValue: oldDateRange.endDate,
        endDateNewValue: newDateRange.endDate,
      };
    });

    createChangeLogs = DateChangeLog.bulkCreate(changeLogsToCreate, {
      transaction,
    });
  }

  // Update or create dateRanges
  let updateDates = Promise.resolve();

  if (filteredDateRanges.length > 0) {
    updateDates = DateRange.bulkCreate(filteredDateRanges, {
      updateOnDuplicate: ["startDate", "endDate", "updatedAt"],
      transaction,
    });
  }

  // Delete dateRanges removed by the user
  let deleteDates = Promise.resolve();

  if (deletedDateRangeIds.length > 0) {
    deleteDates = DateRange.destroy({
      where: {
        id: {
          [Op.in]: deletedDateRangeIds,
        },
      },
      transaction,
    });
  }

  await Promise.all([
    saveSeason,
    updateDates,
    createChangeLogs,
    deleteDates,
    saveDateRangeAnnuals,
    saveGateDetail,
  ]);
}
