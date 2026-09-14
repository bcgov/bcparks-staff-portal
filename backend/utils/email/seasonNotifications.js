// Facade over taskQueuer.js: applies notification-settings checks and turns the
// low-level queue outcome into route-friendly diagnostics messages.
import {
  queueHqApprovalEmail,
  queueDraftReviewEmail,
  queueApprovalRejectedEmail,
} from "./taskQueuer.js";
import { EMAIL_TYPE } from "./content.js";
import { getNotificationSettings } from "./data.js";

/**
 * Invokes a queue function, catching and logging any error so a failed email
 * queue attempt cannot crash the request, then turns the outcome (success,
 * no-recipient, or caught error) into diagnostics for the response payload.
 * @param {string} emailType Notification email type, used in diagnostics/logging
 * @param {string} recipientGroup which group the email goes to ("regional staff", "IS" or "RS")
 * @param {number} seasonId ID of the season, used in diagnostics/logging
 * @param {Function} queueFn Zero-arg function that queues the email and resolves to a boolean
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function invokeQueueFunctionWithErrorHandling(
  emailType,
  recipientGroup,
  seasonId,
  queueFn,
) {
  const diagnostics = [];

  try {
    // Invoke the provided queue function, which enqueues the actual email task and resolves
    // to a boolean indicating whether a recipient was found and the email was queued.
    const { queued, recipientEmails, editTargetLabel } = await queueFn();
    const recipientEmailsDescription =
      recipientEmails?.length > 0 ? `${JSON.stringify(recipientEmails)} ` : "";

    diagnostics.push(
      queued
        ? `Email notification (${emailType}) was queued for ${recipientGroup} ${recipientEmailsDescription}for ${editTargetLabel} season ${seasonId}.`
        : `Email notification (${emailType}) was not queued because no recipient email was found for ${editTargetLabel} season ${seasonId}.`,
    );
  } catch (error) {
    console.error(
      `Failed to queue email notification (${emailType}) for season ${seasonId}:`,
      error,
    );
    diagnostics.push(
      `ERROR: Failed to queue email notification (${emailType}) for season ${seasonId}. ` +
        "Check backend server logs for error details.",
    );
  }

  return diagnostics;
}

/**
 * Queues a Management Area notification email.
 * @param {string} emailType Notification email type
 * @param {Season} season Season the notification is about
 * @param {User} user User who triggered the notification
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function notifyManagementArea(emailType, season, user) {
  const settings = await getNotificationSettings();

  if (!settings.notificationsEnabled) {
    return ["Notifications are disabled."];
  }

  if (!settings.areaSupervisorNotificationsEnabled) {
    return ["Area supervisor notifications are disabled."];
  }

  const queueByEmailType = {
    [EMAIL_TYPE.DRAFT_REVIEW]: queueDraftReviewEmail,
    [EMAIL_TYPE.APPROVAL_REJECTED]: queueApprovalRejectedEmail,
  };

  const queueFn = queueByEmailType[emailType];

  if (!queueFn) {
    throw new Error(
      `notifyManagementArea does not support email type "${emailType}".`,
    );
  }

  return invokeQueueFunctionWithErrorHandling(
    emailType,
    "regional staff",
    season.id,
    () =>
      queueFn(
        season,
        user,
        `routes::utils::email::seasonNotifications::notifyManagementArea::emailType=${emailType}`,
      ),
  );
}

/**
 * Queues an HQ approval email for whichever team(s) still need to review the season.
 * @param {Season} season Season submitted for approval
 * @param {User} user User who submitted the season
 * @param {boolean} notifyInformationServices Whether the Information Services team needs to review
 * @param {boolean} notifyReservationServices Whether the Reservation Services team needs to review
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function notifyHqApprovers(
  season,
  user,
  notifyInformationServices,
  notifyReservationServices,
) {
  const settings = await getNotificationSettings();

  if (!settings.notificationsEnabled) {
    return ["Notifications are disabled."];
  }

  if (!notifyInformationServices && !notifyReservationServices) {
    return ["No HQ team needs to review the season."];
  }

  const emailIS =
    settings.infoServicesNotificationsEnabled && notifyInformationServices;
  const emailRS =
    settings.reservationServicesNotificationsEnabled &&
    notifyReservationServices;

  if (!emailIS && !emailRS) {
    return ["No HQ team notifications are enabled."];
  }

  return invokeQueueFunctionWithErrorHandling(
    EMAIL_TYPE.HQ_APPROVAL,
    [emailIS && "IS", emailRS && "RS"].filter(Boolean).join(" & "),
    season.id,
    () =>
      queueHqApprovalEmail(
        season,
        user,
        "routes::api::seasons::season-save",
        emailIS,
        emailRS,
      ),
  );
}

export { notifyManagementArea, notifyHqApprovers, EMAIL_TYPE };
