import _ from "lodash";

export const EMAIL_TYPE = {
  DRAFT_REVIEW: "draft-review",
  HQ_APPROVAL: "hq-approval",
  APPROVAL_REJECTED: "approval-rejected",
};

/**
 * Gets the email content for a notification type.
 * @param {string} emailType Notification email type
 * @param {boolean} isReminder Whether the email is a reminder
 * @param {string} modifiedByName Name of the user who made the change
 * @param {string} parkSeasonSubject User-facing season edit target
 * @returns {Object} Email subject and template content
 * @throws {Error} If the email type is unsupported
 */
export function getEmailContentByType(
  emailType,
  isReminder,
  modifiedByName,
  parkSeasonSubject,
) {
  const actionText = isReminder ? "Reminder" : "Action required";

  // escape string inputs to prevent XSS attacks
  const safeModifiedByName = _.escape(modifiedByName);
  const safeParkSeasonSubject = _.escape(parkSeasonSubject);

  // doot-contributor role saves a draft.
  if (emailType === EMAIL_TYPE.DRAFT_REVIEW) {
    return {
      subject: `${actionText}: Review and submit new dates`,
      heading: "New dates or gate information to review",
      message:
        "New dates or gate information has been saved by " +
        `${safeModifiedByName} to ${safeParkSeasonSubject}.` +
        "<br><br>" +
        "Please review the changes and, if approved, submit them to HQ.",
      buttonText: "Review changes",
    };
  }

  // doot-submitter role submits dates to HQ for approval.
  if (emailType === EMAIL_TYPE.HQ_APPROVAL) {
    return {
      subject: `${actionText}: Approve new dates`,
      heading: "New dates or gate information submitted",
      message:
        "New dates or gate information has been submitted by " +
        `${safeModifiedByName} to ${safeParkSeasonSubject}.` +
        "<br><br>" +
        "Please review the information for approval.",
      buttonText: "Review changes",
    };
  }

  // HQ rejects the dates and requests changes.
  if (emailType === EMAIL_TYPE.APPROVAL_REJECTED) {
    return {
      subject: `${actionText}: Date update request`,
      heading: "New dates requested",
      message:
        `HQ has reviewed your dates for ${safeParkSeasonSubject}. ` +
        "<br><br>" +
        "Please review the comment and re-submit to HQ.",
      buttonText: "Update dates",
    };
  }

  throw new Error(`Unsupported DOOT email type: ${emailType}`);
}

/**
 * Builds the user-facing label for the season edit target in a notification.
 * @param {Object} seasonInfo Publishable and season details
 * @returns {string} Season edit target label
 */
export function getEditTargetLabel(seasonInfo) {
  const park = seasonInfo.parkName || "";

  if (seasonInfo.parkAreaName) {
    return `${park} (${seasonInfo.parkAreaName})`;
  }

  if (seasonInfo.featureName) {
    return `${park} (${seasonInfo.featureName})`;
  }

  if (seasonInfo.seasonType === "regular") {
    return `${park} (Tiers and gate)`;
  }

  if (seasonInfo.seasonType === "winter") {
    return `${park} (Winter fee)`;
  }

  return park;
}
