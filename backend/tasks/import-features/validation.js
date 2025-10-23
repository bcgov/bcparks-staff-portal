import { Op } from "sequelize";
import { Feature } from "../../models/index.js";

/**
 * Validates DOOT Features for duplicate and invalid strapiOrcsFeatureNumber values
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} Returns true if validation passes, false if validation fails
 */
export async function validateDootFeatures() {
  // Validate DOOT Features to make sure all records have a strapiOrcsFeatureNumber in the
  // format #-# (e.g. "1234-1")
  const invalidFeatures = await Feature.findAll({
    where: {
      [Op.or]: [
        { strapiOrcsFeatureNumber: null },
        { strapiOrcsFeatureNumber: { [Op.notRegexp]: "^[0-9]+-[0-9]+$" } },
      ],
    },
  });

  if (invalidFeatures.length > 0) {
    console.error(
      `Aborting import: Found ${invalidFeatures.length} DOOT Features with missing or incorrectly formatted strapiOrcsFeatureNumber.`,
    );
    return false;
  }

  return true;
}

/**
 * Validates Strapi ParkFeatures for required and valid orcsFeatureNumber attribute and
 * valid orcsAreaNumber attribute
 * @param {Array} features List of Strapi ParkFeature items
 * @returns {boolean} Returns true if validation passes, false if validation fails
 */
export function validateStrapiFeatures(features) {
  for (const feature of features) {
    const { parkFeatureName, orcsFeatureNumber, protectedArea, parkArea } =
      feature.attributes;
    const featureId = feature.id;

    // Check for missing orcsFeatureNumber
    if (!orcsFeatureNumber?.trim().length) {
      console.error(
        `Aborting import: Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - no orcsFeatureNumber found`,
      );
      return false;
    }

    // Make sure protectedArea.orcs exists
    if (!protectedArea?.data?.attributes?.orcs) {
      console.error(
        `Aborting import: Strapi ParkFeature: ${parkFeatureName} (${featureId}) has no related protectedArea.orcs.`,
      );
      return false;
    }

    // Check if orcsFeatureNumber and orcsAreaNumber both start with the expected ORCS
    const expectedPrefix = `${protectedArea.data.attributes.orcs}-`;

    // orcsFeatureNumber must start with protectedArea.orcs + "-"
    if (!orcsFeatureNumber.startsWith(expectedPrefix)) {
      console.error(
        `Aborting import: Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - orcsFeatureNumber "${orcsFeatureNumber}" does not start with expected prefix "${expectedPrefix}"`,
      );
      return false;
    }

    const orcsAreaNumber = parkArea?.data?.attributes?.orcsAreaNumber;

    // orcsAreaNumber is allowed to be null, so only validate if it exists
    if (orcsAreaNumber) {
      if (!orcsAreaNumber.startsWith(expectedPrefix)) {
        console.error(
          `Aborting import: Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - orcsAreaNumber "${orcsAreaNumber}" does not start with expected prefix "${expectedPrefix}"`,
        );
        return false;
      }
    }
  }

  return true;
}
