import { addDays, format } from "date-fns";
import { Op } from "sequelize";
import {
  PendingReminder,
  Season,
  SeasonChangeLog,
} from "../../../models/index.js";

const FOLLOW_UP_DAYS = 14;

/**
 * Saves the information needed to send a follow-up, overwriting any existing
 * entry with the same emailType and numericData.
 * @param {Object} notificationOptions Notification arguments
 * @param {Object} jsonData Notification payload
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<[PendingReminder, boolean | null]>} The upserted reminder and creation status
 */
async function savePendingReminder(notificationOptions, jsonData, transaction) {
  const { season } = notificationOptions;
  const now = new Date();

  // remove some stuff for the jsonData to prevent confusion
  const newJsonData = {
    sendToIS: jsonData.sendToIS,
    sendToRS: jsonData.sendToRS,
    userFullName: jsonData.userFullName,
    recipientEmails: jsonData.recipientEmails,
    noRecipientsError: jsonData.noRecipientsError,
  };

  return PendingReminder.upsert(
    {
      emailType: notificationOptions.emailType,
      numericData: season.id,
      jsonData: newJsonData,
      comparisonDate: season.updatedAt,
      notifyManagementArea: notificationOptions.notifyManagementArea,
      notifyInformationServices: notificationOptions.notifyInformationServices,
      notifyReservationServices: notificationOptions.notifyReservationServices,
      createdAt: now,
      followUpDate: format(addDays(now, FOLLOW_UP_DAYS), "yyyy-MM-dd"),
    },
    { transaction },
  );
}

/**
 * Checks whether the season change log shows any of the listed statuses since the given date.
 * @param {number} seasonId Season ID
 * @param {Array<string>} statusValues Statuses to check
 * @param {Date} sinceDate Only consider changes after this date
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<boolean>} Whether the change log shows a listed status
 */
async function changeLogShowsStatusSince(
  seasonId,
  statusValues,
  sinceDate,
  transaction,
) {
  return (
    (await SeasonChangeLog.findOne({
      attributes: ["id"],
      where: {
        seasonId,
        statusNewValue: { [Op.in]: statusValues },
        createdAt: { [Op.gt]: sinceDate },
      },
      transaction,
    })) !== null
  );
}

/**
 * Checks whether the season's current status is one of the listed statuses.
 * @param {number} seasonId Season ID
 * @param {Array<string>} statusValues Statuses to check
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<boolean>} Whether the current status is listed
 */
async function currentStatusIsAnyOf(seasonId, statusValues, transaction) {
  return (
    (await Season.findOne({
      attributes: ["id"],
      where: {
        id: seasonId,
        status: { [Op.in]: statusValues },
      },
      transaction,
    })) !== null
  );
}

/**
 * Deletes a pending reminder from the database.
 * @param {string} emailType Email type of the reminder
 * @param {number} numericData Numeric data associated with the reminder
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<number>} Number of rows deleted
 */
async function deletePendingReminder(emailType, numericData, transaction) {
  return await PendingReminder.destroy({
    where: {
      emailType,
      numericData,
    },
    transaction,
  });
}

/**
 * Finds reminders whose follow-up date is today or earlier.
 * @returns {Promise<Array<PendingReminder>>} Due pending reminders
 */
async function findDuePendingReminders() {
  return PendingReminder.findAll({
    where: {
      followUpDate: {
        [Op.lte]: format(new Date(), "yyyy-MM-dd"),
      },
    },
  });
}

export {
  savePendingReminder,
  changeLogShowsStatusSince,
  currentStatusIsAnyOf,
  deletePendingReminder,
  findDuePendingReminders,
};
