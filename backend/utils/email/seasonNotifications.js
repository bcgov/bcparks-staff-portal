// Facade over taskQueuer.js: applies notification-settings checks and turns the
// low-level queue outcome into route-friendly diagnostics messages.
import sequelize from "../../db/connection.js";
import * as STATUS from "../../constants/seasonStatus.js";
import { queueNotification, EMAIL_TYPE } from "./taskQueuer.js";
import { loadNotificationSettings } from "./notificationSettings.js";
import { savePendingReminder } from "./reminders/data.js";

/**
 * Queues a notification email, catching and logging any error so a failed queue
 * attempt cannot crash the request, then turns the outcome (success,
 * no-recipient, or caught error) into diagnostics for the response payload.
 * @param {string} recipientGroup which group the email goes to ("regional staff", "IS" or "RS")
 * @param {Object} notificationOptions Arguments to pass to queueNotification
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<{queued: boolean, diagnostics: Array<string>}>} Whether the email was queued, and diagnostics describing the outcome
 */
async function queueNotificationWithDiagnostics(
  recipientGroup,
  notificationOptions,
  transaction,
) {
  const { emailType, season } = notificationOptions;
  const diagnostics = [];
  let queued = false;

  try {
    const { noRecipientsError, editTargetLabel, jsonData } =
      await queueNotification(notificationOptions, transaction);

    queued = true;

    let reminderSet = true;

    if (!notificationOptions.isReminder) {
      try {
        await savePendingReminder(notificationOptions, jsonData, transaction);
      } catch (error) {
        console.error("Failed to save pending reminder:", error);
        reminderSet = false;
      }
    }

    diagnostics.push(
      noRecipientsError
        ? `Email notification (${emailType}) will be sent to Information Services as a fallback because no recipient email was found for ${editTargetLabel} season ${season.id}.`
        : `Email notification (${emailType}) was queued for ${recipientGroup} for ${editTargetLabel} season ${season.id}.`,
    );
    if (!reminderSet) {
      diagnostics.push(
        `A reminder for this notification was not scheduled. Check the backend server logs for error details.`,
      );
    }
  } catch (error) {
    diagnostics.push(
      `ERROR: Failed to queue email notification (${emailType}) for season ${season.id}. ` +
        "Check backend server logs for error details.",
    );
    if (notificationOptions.isReminder) {
      // Re-throw reminder errors so the script can increment the failure count.
      throw error;
    } else {
      // Handle errors with diagnostics and logging  when saving seasons from the UI.
      // Notifications are secondary to saving the season itself.
      console.error(
        `Failed to queue email notification (${emailType}) for season ${season.id}:`,
        error,
      );
    }
  }

  return { queued, diagnostics };
}

/**
 * Queues a Management Area notification email.
 * @param {string} emailType Notification email type
 * @param {Season} season Season the notification is about
 * @param {string} userFullName Full name of the user who triggered the notification
 * @param {Transaction} [transaction] Sequelize transaction
 * @param {boolean} [isReminder=false] Whether the notification is a reminder
 * @returns {Promise<{queued: boolean, diagnostics: Array<string>}>} Whether the email was queued, and diagnostics describing the outcome
 */
async function notifyManagementArea(
  emailType,
  season,
  userFullName,
  transaction,
  isReminder = false,
) {
  const { settings, error } = await loadNotificationSettings();

  if (error) {
    if (isReminder) {
      // Re-throw reminder errors
      throw new Error(error);
    }
    return { queued: false, diagnostics: [error] };
  }

  if (!settings.notificationsEnabled) {
    return { queued: false, diagnostics: ["Notifications are disabled."] };
  }

  if (!settings.areaSupervisorNotificationsEnabled) {
    return {
      queued: false,
      diagnostics: ["Area supervisor notifications are disabled."],
    };
  }

  return queueNotificationWithDiagnostics(
    "regional staff",
    {
      emailType,
      season,
      userFullName,
      triggeredBy: "utils::email::seasonNotifications::notifyManagementArea",
      isReminder,
      notifyManagementArea: true,
    },
    transaction,
  );
}

/**
 * Queues an HQ approval email for whichever team(s) still need to review the season.
 * @param {Season} season Season submitted for approval
 * @param {string} userFullName Full name of the user who submitted the season
 * @param {boolean} notifyInformationServices Whether the Information Services team needs to review
 * @param {boolean} notifyReservationServices Whether the Reservation Services team needs to review
 * @param {Transaction} [transaction] Sequelize transaction
 * @param {boolean} [isReminder=false] Whether the notification is a reminder
 * @returns {Promise<{queued: boolean, diagnostics: Array<string>}>} Whether the email was queued, and diagnostics describing the outcome
 */
async function notifyHqApprovers(
  season,
  userFullName,
  notifyInformationServices,
  notifyReservationServices,
  transaction,
  isReminder = false,
) {
  const { settings, error } = await loadNotificationSettings();

  if (error) {
    if (isReminder) {
      // Re-throw reminder errors
      throw new Error(error);
    }
    return { queued: false, diagnostics: [error] };
  }

  if (!settings.notificationsEnabled) {
    return { queued: false, diagnostics: ["Notifications are disabled."] };
  }

  if (!notifyInformationServices && !notifyReservationServices) {
    return {
      queued: false,
      diagnostics: ["No HQ team needs to review the season."],
    };
  }

  const emailIS =
    settings.infoServicesNotificationsEnabled && notifyInformationServices;
  const emailRS =
    settings.reservationServicesNotificationsEnabled &&
    notifyReservationServices;

  if (!emailIS && !emailRS) {
    return {
      queued: false,
      diagnostics: ["No HQ team notifications are enabled."],
    };
  }

  return queueNotificationWithDiagnostics(
    [emailIS && "IS", emailRS && "RS"].filter(Boolean).join(" & "),
    {
      emailType: EMAIL_TYPE.HQ_APPROVAL,
      season,
      userFullName,
      triggeredBy: "utils::email::seasonNotifications::notifyHqApprovers",
      isReminder,
      notifyManagementArea: false,
      notifyInformationServices: emailIS,
      notifyReservationServices: emailRS,
    },
    transaction,
  );
}

/**
 * Sends notifications after a season is saved through POST /:seasonId/save/.
 * Notifications run in a separate transaction so notification failures do not
 * roll back the season update.
 * @param {Object} options Notification conditions and season data
 * @param {Season} options.updatedSeason Updated season
 * @param {string} options.userFullName Full name of the user who made the change
 * @param {boolean} options.isOnlyContributor Whether the user is only a contributor
 * @param {boolean} options.isOnlySubmitter Whether the user is only a submitter
 * @param {boolean} options.isApprover Whether the user is an approver
 * @param {boolean} options.requiresInformationSvcApproval Whether IS approval is required
 * @param {boolean} options.requiresReservationSvcApproval Whether RS approval is required
 * @returns {Promise<string[]>} Notification diagnostics
 */
async function sendSeasonNotifications({
  updatedSeason,
  userFullName,
  isOnlyContributor,
  isOnlySubmitter,
  isApprover,
  requiresInformationSvcApproval,
  requiresReservationSvcApproval,
}) {
  const newStatus = updatedSeason.status;
  const diagnostics = [];
  let notificationTransaction;

  try {
    notificationTransaction = await sequelize.transaction();

    if (isOnlyContributor && newStatus === STATUS.REQUESTED) {
      diagnostics.push(
        ...(
          await notifyManagementArea(
            EMAIL_TYPE.DRAFT_REVIEW,
            updatedSeason,
            userFullName,
            notificationTransaction,
          )
        ).diagnostics,
      );
    }

    if (isOnlySubmitter && newStatus === STATUS.PENDING_REVIEW) {
      diagnostics.push(
        ...(
          await notifyHqApprovers(
            updatedSeason,
            userFullName,
            requiresInformationSvcApproval,
            requiresReservationSvcApproval,
            notificationTransaction,
          )
        ).diagnostics,
      );
    }

    if (isApprover && newStatus === STATUS.REQUESTED) {
      diagnostics.push(
        ...(
          await notifyManagementArea(
            EMAIL_TYPE.APPROVAL_REJECTED,
            updatedSeason,
            userFullName,
            notificationTransaction,
          )
        ).diagnostics,
      );
    }

    if (!notificationTransaction.finished) {
      await notificationTransaction.commit();
    }
  } catch (error) {
    if (notificationTransaction && !notificationTransaction.finished) {
      await notificationTransaction.rollback();
    }

    console.error("Failed to send season notification email(s):", error);
    diagnostics.push("Season saved, but email notification failed.");
  }

  return diagnostics;
}

export {
  notifyManagementArea,
  notifyHqApprovers,
  sendSeasonNotifications,
  EMAIL_TYPE,
};
