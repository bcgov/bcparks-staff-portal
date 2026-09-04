import { queueStrapiTask } from "./strapiTaskQueue.js";
import { ManagementArea, Park, Publishable } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Gets the Management Areas associated with a Park. Most Parks have one
 * Management Area, but Tweedsmuir and Strathcona each belong to two areas.
 * @param {number} parkId Park ID
 * @returns {Promise<Array>} Matching ManagementArea records with their emails
 */
export async function getParkManagementAreas(parkId) {
  if (!parkId) return [];

  const park = await Park.findByPk(parkId, {
    attributes: ["managementAreas"],
  });

  // Park.managementAreas is a JSONB field. Extract the managementAreaNumber
  // from each management area.
  const managementAreaNumbers = [
    ...new Set(
      (park?.managementAreas || [])
        .map((managementArea) => Number(managementArea.mgmtArea?.number))
        .filter((number) => Number.isInteger(number)),
    ),
  ];

  if (!managementAreaNumbers.length) return [];

  return await ManagementArea.findAll({
    attributes: ["email"],
    where: {
      managementAreaNumber: {
        [Op.in]: managementAreaNumbers,
      },
    },
  });
}

/**
 * Gets the names and Management Area emails associated with a publishable.
 * @param {number} publishableId Publishable ID
 * @returns {Promise<Object>} Publishable details for email notifications
 */
export async function getPublishableDetails(publishableId) {
  const publishable = await Publishable.findByPk(publishableId, {
    include: [
      { association: "park", attributes: ["id", "name"] },
      {
        association: "parkArea",
        attributes: ["name"],
        include: [{ association: "park", attributes: ["id", "name"] }],
      },
      {
        association: "feature",
        attributes: ["name"],
        include: [{ association: "park", attributes: ["id", "name"] }],
      },
    ],
  });

  const park =
    publishable?.park ||
    publishable?.parkArea?.park ||
    publishable?.feature?.park;

  const managementAreas = await getParkManagementAreas(park?.id);

  return {
    parkName: park?.name || null,
    parkAreaName: publishable?.parkArea?.name || null,
    featureName: publishable?.feature?.name || null,
    recipientEmails: managementAreas
      .map((managementArea) => managementArea.email)
      .filter(Boolean),
  };
}

/**
 * Queues an email notification for a contributor's draft edits.
 * @param {Season} season Season saved as a draft
 * @param {User} user User who saved the season
 * @param {string} triggeredBy Identifier for the code path that triggered the email
 * @returns {Promise<boolean>} True when queued, otherwise false when no email exists
 */
export async function queueDraftReviewEmail(season, user, triggeredBy) {
  const parkOperatorName = user?.name || null;
  const { parkName, parkAreaName, featureName, recipientEmails } =
    await getPublishableDetails(season.publishableId);

  if (!recipientEmails.length) return false;

  await queueStrapiTask({
    action: "email doot notification",
    numericData: season.id,
    jsonData: {
      emailType: "draft-review",
      parkOperatorName,
      parkName,
      parkAreaName,
      featureName,
      recipientEmails,
      seasonType: season?.seasonType || null,
      operatingYear: season?.operatingYear || null,
      triggeredBy: `bcparks-staff-portal::backend::${triggeredBy}`,
    },
  });

  // TODO: Write a MailLog record containing the email date, email type
  // (DraftReview), recipients, season ID, and season.updatedAt timestamp.
  // If in two weeks, if the season is still a draft and the season.updatedAt
  // timestamp is unchanged, we will use this information to send a reminder
  // to the original recipients.

  return true;
}
