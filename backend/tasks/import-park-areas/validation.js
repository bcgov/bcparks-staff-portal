import { Op } from "sequelize";
import { ParkArea } from "../../models/index.js";

/**
 * Validates DOOT Park Areas for duplicate and invalid strapiOrcsAreaNumber values
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} Returns true if validation passes, false if validation fails
 */
export async function validateDootParkAreas() {
  // Make sure all records DOOT have a strapiOrcsAreaNumber in the format #-# (e.g. "1234-1")
  const invalidParkAreas = await ParkArea.findAll({
    where: {
      [Op.or]: [
        { strapiOrcsAreaNumber: null },
        { strapiOrcsAreaNumber: { [Op.notRegexp]: "^[0-9]+-[0-9]+$" } },
      ],
    },
  });

  if (invalidParkAreas.length > 0) {
    console.error(
      `Aborting import: Found ${invalidParkAreas.length} DOOT ParkAreas with missing or incorrectly formatted strapiOrcsAreaNumber.`,
    );
    return false;
  }

  return true;
}

/**
 * Validates Strapi ParkAreas for required and valid orcsAreaNumber attribute
 * @param {Array} parkAreas List of Strapi ParkArea items
 * @returns {boolean} Returns true if validation passes, false if validation fails
 */
export function validateStrapiParkAreas(parkAreas) {
  for (const parkArea of parkAreas) {
    const { orcsAreaNumber, parkAreaName, protectedArea } = parkArea.attributes;
    const parkAreaId = parkArea.id;

    // Check for missing orcsAreaNumber
    if (!orcsAreaNumber?.trim().length) {
      console.error(
        `Aborting import: Invalid Strapi ParkArea: ${parkAreaName} (${parkAreaId}) - no orcsAreaNumber found`,
      );
      return false;
    }

    // Make sure protectedArea.orcs exists
    if (!protectedArea?.data?.attributes?.orcs) {
      console.error(
        `Aborting import: Strapi ParkArea: ${parkAreaName} (${parkAreaId}) has no related protectedArea.orcs.`,
      );
      return false;
    }

    // Make sure orcsAreaNumber starts with protectedArea.orcs
    const expectedPrefix = `${protectedArea.data.attributes.orcs}-`;

    if (!orcsAreaNumber.startsWith(expectedPrefix)) {
      console.error(
        `Aborting import: Invalid Strapi ParkArea: ${parkAreaName} (${parkAreaId}) - orcsAreaNumber "${orcsAreaNumber}" does not start with expected prefix "${expectedPrefix}"`,
      );
      return false;
    }
  }

  return true;
}
