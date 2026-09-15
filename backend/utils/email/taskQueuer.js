import { queueStrapiTask } from "../strapiTaskQueue.js";
import {
  getEmailContentByType,
  getEditTargetLabel,
  EMAIL_TYPE,
} from "./content.js";
import { getPublishableDetails } from "./data.js";

// ...existing code...
/**
 * Queues an email notification for a season.
 * @param {Object} options Notification options
 * @param {string}  options.emailType Notification email type
 * @param {Season}  options.season Season associated with the notification
 * @param {User}    options.user User who triggered the notification
 * @param {string}  options.triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} [options.isReminder=false] Whether the notification is a reminder
 * @param {boolean} [options.notifyManagementArea=true] Whether to resolve and require Management Area recipient emails
 * @param {boolean} [options.notifyInformationServices=false] Whether to notify the Information Services team
 * @param {boolean} [options.notifyReservationServices=false] Whether to notify the Reservation Services team
 * @returns {Promise<{queued: boolean, recipientEmails: string[], editTargetLabel: string}>} Outcome and diagnostic details of the queue attempt
 */
async function queueNotification({
  emailType,
  season,
  user,
  triggeredBy,
  isReminder = false,
  notifyManagementArea = true,
  notifyInformationServices = false,
  notifyReservationServices = false,
}) {
  if (!season || !season.seasonType || !season.operatingYear) {
    throw new Error("Season must have a season type and operating year");
  }

  const userFullName = user?.name || null;
  const emailInfo = await getPublishableDetails(
    season.publishableId,
    notifyManagementArea,
  );
  const { seasonFormSlug, recipientEmails } = emailInfo;

  const editTargetLabel = getEditTargetLabel({
    ...emailInfo,
    seasonType: season.seasonType,
  });

  // Only Management Area notifications require a resolved recipient list.
  if (notifyManagementArea && !recipientEmails.length) {
    return { queued: false, recipientEmails, editTargetLabel };
  }

  const { subject, heading, message, buttonText } = getEmailContentByType(
    emailType,
    isReminder,
    userFullName,
    editTargetLabel,
  );

  await queueStrapiTask({
    action: "email doot",
    numericData: season.id,
    jsonData: {
      antiDuplicateKey: `${emailType}:${season.id}`,
      recipientEmails,
      subject,
      heading,
      message,
      buttonText,
      buttonUrlPath: `/dates/edit/${seasonFormSlug}/${season.id}`,
      triggeredBy: `bcparks-staff-portal::backend::${triggeredBy}`,
      sendToIS: notifyInformationServices,
      sendToRS: notifyReservationServices,
    },
  });

  // TODO: Write a MailLog record containing the email date, email type
  // recipients, season ID, and season.updatedAt timestamp.
  // If in two weeks, if the season is still a draft and the season.updatedAt
  // timestamp is unchanged, we will use this information to send a reminder
  // to the original recipients.

  return { queued: true, recipientEmails, editTargetLabel };
}

/**
 * Queues a draft review email for the park's Management Area recipient(s).
 * @param {Season} season Season saved as a draft
 * @param {User} user User who saved the season
 * @param {string} triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} [isReminder=false] Whether the notification is a reminder
 * @returns {Promise<{queued: boolean, recipientEmails: string[], editTargetLabel: string}>} Outcome and diagnostic details of the queue attempt
 */
async function queueDraftReviewEmail(
  season,
  user,
  triggeredBy,
  isReminder = false,
) {
  return queueNotification({
    emailType: EMAIL_TYPE.DRAFT_REVIEW,
    season,
    user,
    triggeredBy,
    isReminder,
    notifyManagementArea: true,
  });
}

/**
 * Queues an HQ approval email for the Information Services team or Reservation Services
 * team or both.
 * @param {Season} season Season submitted for approval
 * @param {User} user User who submitted the season
 * @param {string} triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} notifyInformationServices Whether to notify the Information Services team
 * @param {boolean} notifyReservationServices Whether to notify the Reservation Services team
 * @param {boolean} [isReminder=false] Whether the notification is a reminder
 * @returns {Promise<{queued: boolean, recipientEmails: string[], editTargetLabel: string}>} Outcome and diagnostic details of the queue attempt
 */
async function queueHqApprovalEmail(
  season,
  user,
  triggeredBy,
  notifyInformationServices,
  notifyReservationServices,
  isReminder = false,
) {
  if (!notifyInformationServices && !notifyReservationServices) {
    // this error should get handled by the seasonNotifications::notifyHqApprovers
    throw new Error(
      "At least one of notifyInformationServices or notifyReservationServices must be true.",
    );
  }

  return queueNotification({
    emailType: EMAIL_TYPE.HQ_APPROVAL,
    season,
    user,
    triggeredBy,
    isReminder,
    notifyManagementArea: false,
    notifyInformationServices,
    notifyReservationServices,
  });
}

/**
 * Queues an approval rejection email for the park's Management Area recipient(s).
 * @param {Season} season Season requiring changes
 * @param {User} user User who rejected the season
 * @param {string} triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} [isReminder=false] Whether the notification is a reminder
 * @returns {Promise<{queued: boolean, recipientEmails: string[], editTargetLabel: string}>} Outcome and diagnostic details of the queue attempt
 */
async function queueApprovalRejectedEmail(
  season,
  user,
  triggeredBy,
  isReminder = false,
) {
  return queueNotification({
    emailType: EMAIL_TYPE.APPROVAL_REJECTED,
    season,
    user,
    triggeredBy,
    isReminder,
    notifyManagementArea: true,
  });
}

export {
  queueDraftReviewEmail,
  queueHqApprovalEmail,
  queueApprovalRejectedEmail,
};
