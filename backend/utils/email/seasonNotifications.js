// Facade over taskQueuer.js: applies notification-settings checks and turns the
// low-level queue outcome into route-friendly diagnostics messages.
import { queueNotification, EMAIL_TYPE } from "./taskQueuer.js";
import { getNotificationSettings } from "./data.js";

/**
 * Queues a notification email, catching and logging any error so a failed queue
 * attempt cannot crash the request, then turns the outcome (success,
 * no-recipient, or caught error) into diagnostics for the response payload.
 * @param {string} recipientGroup which group the email goes to ("regional staff", "IS" or "RS")
 * @param {Object} queueNotificationArgs Arguments to pass to queueNotification
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function queueNotificationWithDiagnostics(
  recipientGroup,
  queueNotificationArgs,
) {
  const { emailType, season } = queueNotificationArgs;
  const diagnostics = [];

  try {
    const { queued, editTargetLabel } = await queueNotification(
      queueNotificationArgs,
    );

    diagnostics.push(
      queued
        ? `Email notification (${emailType}) was queued for ${recipientGroup} for ${editTargetLabel} season ${season.id}.`
        : `Email notification (${emailType}) was not queued because no recipient email was found for ${editTargetLabel} season ${season.id}.`,
    );
  } catch (error) {
    console.error(
      `Failed to queue email notification (${emailType}) for season ${season.id}:`,
      error,
    );
    diagnostics.push(
      `ERROR: Failed to queue email notification (${emailType}) for season ${season.id}. ` +
        "Check backend server logs for error details.",
    );
  }

  return diagnostics;
}

/**
 * Loads notification settings, catching and logging any error so a failed
 * lookup cannot crash the request.
 * @returns {Promise<{settings: Object, error: null} | {settings: null, error: string}>} Result
 */
async function loadNotificationSettings() {
  try {
    return { settings: await getNotificationSettings(), error: null };
  } catch (error) {
    console.error(`Failed to get notification settings:`, error);
    return {
      settings: null,
      error:
        "ERROR: Failed to get notification settings. " +
        "Check backend server logs for error details.",
    };
  }
}

/**
 * Queues a Management Area notification email.
 * @param {string} emailType Notification email type
 * @param {Season} season Season the notification is about
 * @param {string} userFullName Full name of the user who triggered the notification
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function notifyManagementArea(emailType, season, userFullName) {
  const { settings, error } = await loadNotificationSettings();

  if (error) return [error];

  if (!settings.notificationsEnabled) {
    return ["Notifications are disabled."];
  }

  if (!settings.areaSupervisorNotificationsEnabled) {
    return ["Area supervisor notifications are disabled."];
  }

  return queueNotificationWithDiagnostics("regional staff", {
    emailType,
    season,
    userFullName,
    triggeredBy: `routes::utils::email::seasonNotifications::notifyManagementArea::emailType=${emailType}`,
    isReminder: false,
    notifyManagementArea: true,
  });
}

/**
 * Queues an HQ approval email for whichever team(s) still need to review the season.
 * @param {Season} season Season submitted for approval
 * @param {string} userFullName Full name of the user who submitted the season
 * @param {boolean} notifyInformationServices Whether the Information Services team needs to review
 * @param {boolean} notifyReservationServices Whether the Reservation Services team needs to review
 * @returns {Promise<Array<string>>} Diagnostics describing the outcome
 */
async function notifyHqApprovers(
  season,
  userFullName,
  notifyInformationServices,
  notifyReservationServices,
) {
  const { settings, error } = await loadNotificationSettings();

  if (error) return [error];

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

  return queueNotificationWithDiagnostics(
    [emailIS && "IS", emailRS && "RS"].filter(Boolean).join(" & "),
    {
      emailType: EMAIL_TYPE.HQ_APPROVAL,
      season,
      userFullName,
      triggeredBy:
        "routes::utils::email::seasonNotifications::notifyHqApprovers",
      isReminder: false,
      notifyManagementArea: false,
      notifyInformationServices: emailIS,
      notifyReservationServices: emailRS,
    },
  );
}

export { notifyManagementArea, notifyHqApprovers, EMAIL_TYPE };
