/**
 * Shared utility functions for season-related operations.
 * Used by create-seasons and create-winter-seasons scripts.
 */

import {
  Dateable,
  Publishable,
  Park,
  Season,
  Feature,
  ParkArea,
  AccessGroup,
  User,
  UserAccessGroup,
} from "../models/index.js";
import checkUserRoles, { getRolesFromAuth } from "./checkUserRoles.js";
import * as USER_ROLES from "../constants/userRoles.js";

/**
 * Creates a new Publishable or Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {string} keyName The name of the key to check ("publishableId" or "dateableId")
 * @param {any} KeyModel Db model to use for creating the new ID (Publishable or Dateable)
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<{key: number, added: boolean}>} The ID and whether it was created
 */
export async function createKey(record, keyName, KeyModel, transaction) {
  if (record[keyName]) return { key: record[keyName], added: false };

  // Create the missing FK record in the junction table
  const junctionKey = await KeyModel.create({}, { transaction });

  record[keyName] = junctionKey.id;
  await record.save({ transaction });
  return { key: junctionKey.id, added: true };
}

/**
 * Creates a new Publishable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<number>} The record's Publishable ID
 */
export async function createPublishableId(record, transaction) {
  const { key, added } = await createKey(
    record,
    "publishableId",
    Publishable,
    transaction,
  );

  return { key, added };
}

/**
 * Creates a new Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<number>} The record's Dateable ID
 */
export async function createDateableId(record, transaction) {
  const { key, added } = await createKey(
    record,
    "dateableId",
    Dateable,
    transaction,
  );

  return { key, added };
}

/**
 * Checks if the current user has access to the requested season.
 * Access is granted when the user has ALL_PARK_ACCESS, otherwise by AccessGroup membership.
 * @param {Object} req Express request object
 * @param {number} seasonId The season ID to authorize
 * @returns {Promise<boolean>} True when authorized, false when season is not found
 */
export async function checkSeasonUserAccess(req, seasonId) {
  const hasAllParkAccess = checkUserRoles(getRolesFromAuth(req.auth), [
    USER_ROLES.ALL_PARK_ACCESS,
  ]);

  if (hasAllParkAccess) {
    return true;
  }

  const season = await Season.findByPk(seasonId, {
    attributes: ["id"],
    include: [
      {
        model: Park,
        as: "park",
        attributes: ["id"],
        required: false,
      },
      {
        model: Feature,
        as: "feature",
        attributes: ["id", "parkId"],
        required: false,
      },
      {
        model: ParkArea,
        as: "parkArea",
        attributes: ["id", "parkId"],
        required: false,
      },
    ],
  });

  if (!season) {
    return false;
  }

  const parkId =
    season.park?.id ?? season.feature?.parkId ?? season.parkArea?.parkId;

  if (!parkId) {
    const error = new Error("Park not found for this season");

    error.status = 404;
    throw error;
  }

  const authorizedPark = await Park.findOne({
    attributes: ["id"],
    where: { id: parkId },
    include: [
      {
        model: AccessGroup,
        as: "accessGroups",
        attributes: ["id"],
        required: true,
        include: [
          {
            model: User,
            as: "users",
            attributes: [],
            where: { username: req.user?.username },
            through: {
              model: UserAccessGroup,
              attributes: [],
            },
            required: true,
          },
        ],
      },
    ],
  });

  if (!authorizedPark) {
    const error = new Error(
      "Permission denied: You do not have access to this park.",
    );

    error.status = 403;
    throw error;
  }

  return true;
}
