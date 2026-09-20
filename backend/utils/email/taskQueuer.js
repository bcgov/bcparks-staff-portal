import { queueStrapiTask } from "../strapiTaskQueue.js";
import {
  getEmailContentByType,
  getEditTargetLabel,
  EMAIL_TYPE,
} from "./content.js";
import { getPublishableDetails } from "./data.js";

/**
 * Queues an email notification for a season.
 * @param {Object} options Notification options
 * @param {string}  options.emailType Notification email type
 * @param {Season}  options.season Season associated with the notification
 * @param {string}  options.userFullName Full name of the user who triggered the notification
 * @param {string}  options.triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} [options.isReminder=false] Whether the notification is a reminder
 * @param {boolean} [options.notifyManagementArea=true] Whether to resolve and require Management Area recipient emails
 * @param {boolean} [options.notifyInformationServices=false] Whether to notify the Information Services team
 * @param {boolean} [options.notifyReservationServices=false] Whether to notify the Reservation Services team
 * @returns {Promise<{queued: boolean, editTargetLabel: string}>} Outcome and diagnostic details of the queue attempt
 */
async function queueNotification({
  emailType,
  season,
  userFullName,
  triggeredBy,
  isReminder = false,
  notifyManagementArea = true,
  notifyInformationServices = false,
  notifyReservationServices = false,
}) {
  if (!season || !season.seasonType || !season.operatingYear) {
    throw new Error("Season must have a season type and operating year");
  }

  // Until a review tab is available, CC information services on reminder emails,
  // even when they are not an original recipient. Remove this when the review
  // tab is implemented.
  const shouldNotifyInformationServices =
    notifyInformationServices || (isReminder && !notifyReservationServices);

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
    return { queued: false, editTargetLabel };
  }

  const { subject, heading, message, buttonText } = getEmailContentByType(
    emailType,
    isReminder,
    userFullName,
    editTargetLabel,
  );

  const jsonData = {
    antiDuplicateKey: `${emailType}:${season.id}`,
    recipientEmails,
    subject,
    heading,
    message,
    buttonText,
    buttonUrlPath: `/dates/edit/${seasonFormSlug}/${season.id}`,
    triggeredBy: `bcparks-staff-portal::backend::${triggeredBy}`,
    sendToIS: shouldNotifyInformationServices,
    sendToRS: notifyReservationServices,
    userFullName,
  };

  await queueStrapiTask({
    action: "email doot",
    numericData: season.id,
    jsonData,
  });

  // TODO: Write a MailLog record containing the email date, email type
  // recipients, season ID, and season.updatedAt timestamp.
  // If in two weeks, if the season is still a draft and the season.updatedAt
  // timestamp is unchanged, we will use this information to send a reminder
  // to the original recipients.

  return { queued: true, editTargetLabel };
}

export { queueNotification, EMAIL_TYPE };
