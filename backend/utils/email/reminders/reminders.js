import { addDays, format } from "date-fns";
import { Season } from "../../../models/index.js";
import { changeLogShowsStatusSince, currentStatusIsAnyOf } from "./data.js";
import { EMAIL_TYPE } from "../../email/content.js";
import {
  notifyHqApprovers,
  notifyManagementArea,
} from "../../email/seasonNotifications.js";
import * as SEASON_STATUS from "../../../constants/seasonStatus.js";

const REMINDER_RESULT = {
  RESOLVED: "resolved",
  MISSING: "missing",
  QUEUED: "queued",
  SKIPPED: "skipped",
  STALE: "stale",
};

/**
 * Checks whether the season has progressed beyond the status it had when the
 * original notification was sent. It checks both logged changes and current
 * status because manual or scripted changes may not generate change-log entries.
 * @param {number} seasonId Season ID
 * @param {string} baseStatus Status when the original notification was sent
 * @param {Date} sinceDate Only consider history after this date
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<boolean>} Whether the season has progressed
 */
async function seasonStatusHasProgressedSince(
  seasonId,
  baseStatus,
  sinceDate,
  transaction,
) {
  let progressionStatuses;

  if (baseStatus === SEASON_STATUS.REQUESTED) {
    progressionStatuses = [
      SEASON_STATUS.PENDING_REVIEW,
      SEASON_STATUS.APPROVED,
      SEASON_STATUS.PUBLISHED,
    ];
  } else if (baseStatus === SEASON_STATUS.PENDING_REVIEW) {
    progressionStatuses = [SEASON_STATUS.APPROVED, SEASON_STATUS.PUBLISHED];
  } else {
    throw new Error(`Unsupported base season status: ${baseStatus}`);
  }

  return (
    (await changeLogShowsStatusSince(
      seasonId,
      progressionStatuses,
      sinceDate,
      transaction,
    )) ||
    (await currentStatusIsAnyOf(seasonId, progressionStatuses, transaction))
  );
}

/**
 * Evaluates a pending reminder and queues a follow-up when action is still required.
 * @param {PendingReminder} reminder Pending reminder to process
 * @param {Transaction} transaction Sequelize transaction
 * @returns {Promise<string>} Processing result from REMINDER_RESULT
 */
async function processPendingReminder(reminder, transaction) {
  const staleThresholdDate = format(
    addDays(new Date(reminder.followUpDate), 7),
    "yyyy-MM-dd",
  );
  const isStale = format(new Date(), "yyyy-MM-dd") > staleThresholdDate;

  if (isStale) return REMINDER_RESULT.STALE;

  const baseStatus =
    reminder.emailType === EMAIL_TYPE.HQ_APPROVAL
      ? SEASON_STATUS.PENDING_REVIEW
      : SEASON_STATUS.REQUESTED;

  // A reminder is complete when the season has progressed beyond the status
  // that triggered the original notification.
  const actionComplete = await seasonStatusHasProgressedSince(
    reminder.numericData,
    baseStatus,
    reminder.comparisonDate,
    transaction,
  );

  if (actionComplete) return REMINDER_RESULT.RESOLVED;

  const season = await Season.findOne({
    where: { id: reminder.numericData },
    transaction,
  });

  if (!season) {
    console.warn(
      `Season with ID ${reminder.numericData} not found. Skipping reminder.`,
    );
    return REMINDER_RESULT.MISSING;
  }

  let notifyInformationServices = reminder.notifyInformationServices;
  let notifyReservationServices = reminder.notifyReservationServices;

  if (reminder.emailType === EMAIL_TYPE.HQ_APPROVAL) {
    notifyInformationServices =
      notifyInformationServices && !season.informationSvcApproved;
    notifyReservationServices =
      notifyReservationServices && !season.reservationSvcApproved;

    if (!notifyInformationServices && !notifyReservationServices) {
      notifyInformationServices = true;
    }
  }

  let queued;

  if (reminder.emailType === EMAIL_TYPE.HQ_APPROVAL) {
    ({ queued } = await notifyHqApprovers(
      season,
      reminder.jsonData.userFullName,
      notifyInformationServices,
      notifyReservationServices,
      transaction,
      true,
    ));
  } else {
    ({ queued } = await notifyManagementArea(
      reminder.emailType,
      season,
      reminder.jsonData.userFullName,
      transaction,
      true,
    ));
  }

  if (!queued) return REMINDER_RESULT.SKIPPED;

  return REMINDER_RESULT.QUEUED;
}

export {
  REMINDER_RESULT,
  processPendingReminder,
  seasonStatusHasProgressedSince,
};
