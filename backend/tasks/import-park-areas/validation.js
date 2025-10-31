import { Op } from "sequelize";
import { ParkArea } from "../../models/index.js";

/**
 * Validates DOOT Park Areas for invalid strapiOrcsAreaNumber values
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} Returns true if validation passes, false if validation fails
 */
export async function validateDootParkAreas() {
  let isValid = true;

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
      `Found ${invalidParkAreas.length} DOOT ParkAreas with missing or incorrectly formatted strapiOrcsAreaNumber.`,
    );
    isValid = false;
  }

  return isValid;
}

/**
 * Validates Strapi ParkAreas for required and valid orcsAreaNumber attribute
 * @param {Array} parkAreas List of Strapi ParkArea items
 * @returns {boolean} Returns true if validation passes, false if validation fails
 */
export function validateStrapiParkAreas(parkAreas) {
  let isValid = true;

  // Validate each Strapi ParkArea
  for (const parkArea of parkAreas) {
    const { orcsAreaNumber, parkAreaName, protectedArea } = parkArea;
    const parkAreaId = parkArea.id;

    // Check for missing orcsAreaNumber
    if (!orcsAreaNumber?.trim().length) {
      console.error(
        `Invalid Strapi ParkArea: ${parkAreaName} (${parkAreaId}) - no orcsAreaNumber found`,
      );
      isValid = false;
    }

    // Make sure protectedArea.orcs exists
    if (!protectedArea?.data?.attributes?.orcs) {
      console.error(
        `Strapi ParkArea: ${parkAreaName} (${parkAreaId}) has no related protectedArea.orcs.`,
      );
      isValid = false;
    } else {
      // Make sure orcsAreaNumber starts with protectedArea.orcs
      const expectedPrefix = `${protectedArea.data.attributes.orcs}-`;

      if (!orcsAreaNumber.startsWith(expectedPrefix)) {
        console.error(
          `Invalid Strapi ParkArea: ${parkAreaName} (${parkAreaId}) - orcsAreaNumber "${orcsAreaNumber}" does not start with expected prefix "${expectedPrefix}"`,
        );
        isValid = false;
      }
    }
  }

  return isValid;
}
