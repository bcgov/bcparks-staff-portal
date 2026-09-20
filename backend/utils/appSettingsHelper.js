import { Op } from "sequelize";
import { AppSetting } from "../models/index.js";

/**
 * Gets application-wide settings.
 * @param {string[]} [keys] Keys to retrieve. If omitted, retrieves all settings.
 * @returns {Promise<Record<string, unknown>>} Application settings
 */
async function getAppSettings(keys) {
  if (keys && (!Array.isArray(keys) || !keys.length)) {
    throw new TypeError("keys must be a non-empty array when provided");
  }

  const options = {};

  if (keys) {
    options.where = { key: { [Op.in]: keys } };
  }

  const appSettings = await AppSetting.findAll(options);

  return Object.fromEntries(appSettings.map(({ key, value }) => [key, value]));
}

export { getAppSettings };
