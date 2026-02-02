import { Op } from "sequelize";
import { Feature } from "../../models/index.js";

/**
 * Validates DOOT Features for invalid strapiOrcsFeatureNumber values
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} Returns true if validation passes, false if validation fails
 */
export async function validateDootFeatures() {
  let isValid = true;

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
    for (const feature of invalidFeatures) {
      console.warn(
        `Invalid DOOT Feature: ${feature.name} (${feature.id}) - strapiOrcsFeatureNumber: "${feature.strapiOrcsFeatureNumber}"`,
      );
    }
    console.error(
      `Found ${invalidFeatures.length} DOOT Features with missing or incorrectly formatted strapiOrcsFeatureNumber.`,
    );
    isValid = false;
  }

  return isValid;
}

/**
 * Validates Strapi ParkFeatures for required and valid orcsFeatureNumber attribute and
 * valid orcsAreaNumber attribute
 * @param {Array} features List of Strapi ParkFeature items
 * @returns {boolean} Returns true if validation passes, false if validation fails
 */
export function validateStrapiFeatures(features) {
  let isValid = true;

  // Validate each Strapi ParkFeature
  for (const feature of features) {
    const { parkFeatureName, orcsFeatureNumber, protectedArea, parkArea } =
      feature;
    const featureId = feature.id;

    // Check for missing orcsFeatureNumber
    if (!orcsFeatureNumber?.trim().length) {
      console.error(
        `Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - no orcsFeatureNumber found`,
      );
      isValid = false;
    }

    // Make sure protectedArea.orcs exists
    if (!protectedArea?.orcs) {
      console.error(
        `Strapi ParkFeature: ${parkFeatureName} (${featureId}) has no related protectedArea.`,
      );
      isValid = false;

      // Skip further checks if protectedArea.orcs is missing
      continue;
    }

    // Check if orcsFeatureNumber and orcsAreaNumber both start with the expected ORCS
    const expectedPrefix = `${protectedArea.orcs}-`;

    // orcsFeatureNumber must start with protectedArea.orcs + "-"
    if (orcsFeatureNumber && !orcsFeatureNumber.startsWith(expectedPrefix)) {
      console.error(
        `Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - orcsFeatureNumber "${orcsFeatureNumber}" does not start with expected prefix "${expectedPrefix}"`,
      );
      isValid = false;
    }

    const orcsAreaNumber = parkArea?.data?.orcsAreaNumber;

    // orcsAreaNumber is allowed to be null, so only validate if it exists
    if (orcsAreaNumber) {
      if (!orcsAreaNumber.startsWith(expectedPrefix)) {
        console.error(
          `Invalid Strapi ParkFeature: ${parkFeatureName} (${featureId}) - orcsAreaNumber "${orcsAreaNumber}" does not start with expected prefix "${expectedPrefix}"`,
        );
        isValid = false;
      }
    }
  }

  return isValid;
}
