import { getAppSettings } from "../appSettingsHelper.js";
import { executeWithRetry } from "../../db/transaction.js";

/**
 * Gets email-related application settings and applies default values.
 * Cron loads these settings outside a transaction, so transient database
 * connection failures are retried before the operation fails.
 * @returns {Promise<{notificationsEnabled: boolean, areaSupervisorNotificationsEnabled: boolean, infoServicesNotificationsEnabled: boolean, reservationServicesNotificationsEnabled: boolean}>} Notification settings:
 * - `notificationsEnabled`: global switch controlling whether the app sends any email notifications
 * - `areaSupervisorNotificationsEnabled`: whether email notifications are sent to area supervisors
 * - `infoServicesNotificationsEnabled`: whether email notifications are sent to Information Services staff
 * - `reservationServicesNotificationsEnabled`: whether email notifications are sent to Reservation Services staff
 */
async function getNotificationSettings() {
  const appSettings = await executeWithRetry(() =>
    getAppSettings([
      "notificationsEnabled",
      "areaSupervisorNotificationsEnabled",
      "infoServicesNotificationsEnabled",
      "reservationServicesNotificationsEnabled",
    ]),
  );

  return {
    notificationsEnabled: appSettings.notificationsEnabled ?? true,
    areaSupervisorNotificationsEnabled:
      appSettings.areaSupervisorNotificationsEnabled ?? true,
    infoServicesNotificationsEnabled:
      appSettings.infoServicesNotificationsEnabled ?? true,
    reservationServicesNotificationsEnabled:
      appSettings.reservationServicesNotificationsEnabled ?? true,
  };
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

export { getNotificationSettings, loadNotificationSettings };
