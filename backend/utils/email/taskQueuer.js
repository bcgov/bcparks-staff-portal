import { queueStrapiTask } from "../strapi/strapiTaskQueue.js";
import {
  getEmailContentByType,
  getEditTargetLabel,
  EMAIL_TYPE,
} from "./content.js";
import { getPublishableDetails } from "./data.js";

/**
 * Queues an email notification for a season.
 * NOTE: `isReminder: true` is only ever passed by the cron task, which calls
 * this function directly and does not use the diagnostics wrapper in
 * seasonNotifications.js.
 * @param {Object} options Notification options
 * @param {string}  options.emailType Notification email type
 * @param {Season}  options.season Season associated with the notification
 * @param {string}  options.userFullName Full name of the user who triggered the notification
 * @param {string}  options.triggeredBy Identifier for the code path that triggered the email
 * @param {boolean} [options.isReminder=false] Whether the notification is a reminder
 * @param {boolean} [options.notifyManagementArea=true] Whether to resolve and require Management Area recipient emails
 * @param {boolean} [options.notifyInformationServices=false] Whether to notify the Information Services team
 * @param {boolean} [options.notifyReservationServices=false] Whether to notify the Reservation Services team
 * @param {Transaction} [transaction] Sequelize transaction
 * @returns {Promise<{noRecipientsError?: boolean, editTargetLabel: string, jsonData: Object}>} Outcome and diagnostic details of the queue attempt
 */
async function queueNotification(
  {
    emailType,
    season,
    userFullName,
    triggeredBy,
    isReminder = false,
    notifyManagementArea = true,
    notifyInformationServices = false,
    notifyReservationServices = false,
  },
  transaction,
) {
  if (!season || !season.seasonType || !season.operatingYear) {
    throw new Error("Season must have a season type and operating year");
  }

  // Until a review tab is available, CC information services on reminder emails,
  // even when they are not an original recipient. Remove this when the review
  // tab is implemented.
  let shouldNotifyInformationServices =
    notifyInformationServices || (isReminder && !notifyReservationServices);
  let noRecipientsError;

  const emailInfo = await getPublishableDetails(
    season.publishableId,
    notifyManagementArea,
    transaction,
  );
  const { seasonFormSlug, recipientEmails } = emailInfo;

  const editTargetLabel = getEditTargetLabel({
    ...emailInfo,
    seasonType: season.seasonType,
  });

  // Fall back to Information Services when no Management Area recipient
  // addresses are found, and keep that diagnostic on reminder emails too.
  if (notifyManagementArea && !recipientEmails.length) {
    noRecipientsError = true;

    if (!shouldNotifyInformationServices && !notifyReservationServices) {
      shouldNotifyInformationServices = true;
    }
  }

  const { subject, heading, message, buttonText } = getEmailContentByType(
    emailType,
    isReminder,
    userFullName,
    editTargetLabel,
  );

  const jsonData = {
    heading,
    message,
    subject,
    sendToIS: shouldNotifyInformationServices,
    sendToRS: notifyReservationServices,
    buttonText,
    isReminder,
    triggeredBy: `bcparks-staff-portal::backend::${triggeredBy}`,
    userFullName,
    buttonUrlPath: `/dates/edit/${seasonFormSlug}/${season.id}`,
    recipientEmails,
    antiDuplicateKey: `${emailType}:${season.id}`,
    noRecipientsError,
  };

  await queueStrapiTask({
    action: "email doot",
    numericData: season.id,
    jsonData,
  });

  return { noRecipientsError, editTargetLabel, jsonData };
}

export { queueNotification, EMAIL_TYPE };
