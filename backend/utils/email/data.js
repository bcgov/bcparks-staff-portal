import {
  Feature,
  ManagementArea,
  Park,
  ParkArea,
  Publishable,
} from "../../models/index.js";
import { Op } from "sequelize";

/**
 * Gets the Management Areas associated with a Park. Most Parks have one
 * Management Area, but Tweedsmuir and Strathcona each belong to two areas.
 * @param {number} parkId Park ID
 * @returns {Promise<Array>} Matching ManagementArea records with their emails
 */
async function getParkManagementAreas(parkId) {
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
 * @param {boolean} [includeManagementAreaEmails=true] Whether to resolve Management Area recipient emails
 * @returns {Promise<Object>} Publishable details for email notifications
 */
async function getPublishableDetails(
  publishableId,
  includeManagementAreaEmails = true,
) {
  const publishable = await Publishable.findByPk(publishableId, {
    include: [
      { model: Park, as: "park", attributes: ["id", "name"] },
      {
        model: ParkArea,
        as: "parkArea",
        attributes: ["name"],
        include: [{ model: Park, as: "park", attributes: ["id", "name"] }],
      },
      {
        model: Feature,
        as: "feature",
        attributes: ["name"],
        include: [{ model: Park, as: "park", attributes: ["id", "name"] }],
      },
    ],
  });

  const park =
    publishable?.park ||
    publishable?.parkArea?.park ||
    publishable?.feature?.park;

  if (!park || !park.name) {
    throw new Error("Publishable must be associated with a named park");
  }

  // Skip the Management Area lookup when recipients come from elsewhere.
  const managementAreas = includeManagementAreaEmails
    ? await getParkManagementAreas(park?.id)
    : [];

  // get the form-type for the DOOT url
  let seasonFormSlug = "park";

  if (publishable?.parkArea) {
    seasonFormSlug = "park-area";
  } else if (publishable?.feature) {
    seasonFormSlug = "feature";
  }

  return {
    parkName: park.name,
    parkAreaName: publishable?.parkArea?.name || null,
    featureName: publishable?.feature?.name || null,
    seasonFormSlug,
    recipientEmails: managementAreas
      .map((managementArea) => managementArea.email)
      .filter(Boolean),
  };
}

/**
 * Gets application-wide notification settings.
 * @returns {Promise<{notificationsEnabled: boolean, areaSupervisorNotificationsEnabled: boolean, infoServicesNotificationsEnabled: boolean, reservationServicesNotificationsEnabled: boolean}>} Notification settings
 */
// TODO: This will be added to a table and accessed via Sequelize
async function getNotificationSettings() {
  return {
    notificationsEnabled: true,
    areaSupervisorNotificationsEnabled: true,
    infoServicesNotificationsEnabled: true,
    reservationServicesNotificationsEnabled: true,
  };
}

export {
  getPublishableDetails,
  getParkManagementAreas,
  getNotificationSettings,
};
