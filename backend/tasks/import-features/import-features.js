import "../../env.js";

import { Op } from "sequelize";
import { Park, Feature, ParkArea, FeatureType } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";
import { validateDootFeatures, validateStrapiFeatures } from "./validation.js";

/**
 * Imports/updates Feature records from Strapi park-feature data by matching orcsFeatureNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importFeaturesFromStrapi(transaction = null) {
  try {
    // Get park-feature data from Strapi
    const parkFeatureData = await getStrapiModelData("park-feature");
    const strapiParkFeatures = parkFeatureData?.items || [];

    if (strapiParkFeatures.length === 0) {
      console.log("No Feature data found in Strapi");
      return { created: 0, skipped: 0, updated: 0 };
    }

    console.log(`Found ${strapiParkFeatures.length} Features in Strapi`);

    // Validate Features in DOOT and Strapi
    const dootValid = await validateDootFeatures();
    const strapiValid = validateStrapiFeatures(strapiParkFeatures);

    let useSafeMode = false;

    if (!dootValid || !strapiValid) {
      useSafeMode = true;
      console.warn(
        "Validation failed. Running in safe mode: only updates allowed, no inserts or deactivations.",
      );
    }

    // Get all DOOT Features for strapiOrcsFeatureNumber lookup
    const dootFeatures = await Feature.findAll({
      where: { strapiOrcsFeatureNumber: { [Op.ne]: null } },
      transaction,
    });
    const featureLookup = new Map(
      dootFeatures.map((feature) => [
        feature.strapiOrcsFeatureNumber, // Key: e.g. "1234-1"
        feature, // Value: Feature record
      ]),
    );

    console.log(`Found ${dootFeatures.length} existing Features in DOOT`);

    // Get all DOOT Parks for orcs lookup
    const dootParks = await Park.findAll({
      where: { orcs: { [Op.ne]: null } },
      transaction,
    });
    const parkLookup = new Map(
      dootParks.map((park) => [
        park.orcs, // Key: e.g. "1234"
        park, // Value: park
      ]),
    );

    // Get all DOOT Park areas for orcsAreaNumber lookup
    const dootParkAreas = await ParkArea.findAll({
      where: { strapiOrcsAreaNumber: { [Op.ne]: null } },
      transaction,
    });
    const parkAreaLookup = new Map(
      dootParkAreas.map((parkArea) => [
        parkArea.strapiOrcsAreaNumber, // Key: e.g. "1234-1"
        parkArea, // Value: ParkArea record
      ]),
    );

    // Get all DOOT FeatureTypes for strapiFeatureTypeId lookup
    const dootFeatureTypes = await FeatureType.findAll({
      where: { strapiFeatureTypeId: { [Op.ne]: null } },
      transaction,
    });
    const featureTypeLookup = new Map(
      dootFeatureTypes.map((featureType) => [
        featureType.strapiFeatureTypeId, // Key: e.g. "10"
        featureType, // Value: FeatureType record
      ]),
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let deactivatedCount = 0;

    for (const strapiParkFeature of strapiParkFeatures) {
      const {
        orcsFeatureNumber,
        parkFeatureName,
        isActive,
        inReservationSystem,
        hasReservations,
        hasBackcountryPermits,
        protectedArea,
        parkArea,
        parkFeatureType,
      } = strapiParkFeature;

      // Get the parkId from the related protectedArea
      let parkId = null;
      const protectedAreaOrcs = protectedArea?.data?.attributes.orcs;

      if (protectedAreaOrcs && protectedAreaOrcs.length) {
        const protectedAreaOrcsString = String(protectedAreaOrcs);
        const matchedPark = parkLookup.get(protectedAreaOrcsString) ?? null;

        parkId = matchedPark?.id ?? null;
      }

      // Get the parkAreaId from the related parkArea
      let parkAreaId = null;
      const orcsParkAreaNumber = parkArea?.data?.orcsAreaNumber;

      if (orcsParkAreaNumber && orcsParkAreaNumber.length) {
        const matchedParkArea = parkAreaLookup.get(orcsParkAreaNumber) ?? null;

        parkAreaId = matchedParkArea?.id ?? null;
      }

      // Get the featureTypeId from the related parkFeatureType
      let featureTypeId = null;
      const strapiFeatureTypeId = parkFeatureType?.data?.featureTypeId;

      if (strapiFeatureTypeId) {
        const matchedFeatureType =
          featureTypeLookup.get(strapiFeatureTypeId) ?? null;

        featureTypeId = matchedFeatureType?.id ?? null;
      }

      if (!orcsFeatureNumber) {
        console.warn(
          `Skipping Feature: "${parkFeatureName}" - no orcsFeatureNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ParkFeature by strapiOrcsFeatureNumber
      const matchedDootFeature = featureLookup.get(orcsFeatureNumber);

      const dootFeatureToSave = {
        name: parkFeatureName,
        strapiOrcsFeatureNumber: orcsFeatureNumber,
        active: isActive ?? true,
        inReservationSystem: inReservationSystem ?? false,
        hasReservations: hasReservations ?? false,
        hasBackcountryPermits: hasBackcountryPermits ?? false,
        parkId,
        parkAreaId,
        featureTypeId,
      };

      if (matchedDootFeature) {
        if (isActive && !matchedDootFeature.active) {
          console.warn(
            `Skipping reactivation of feature: ${parkFeatureName} (${orcsFeatureNumber}). ` +
              `This feature is active in Strapi but inactive in DOOT. ` +
              `To reactivate, either activate it manually via AdminJS or assign a new ` +
              `orcsFeatureNumber in Strapi. This is a safety measure to avoid orcsFeatureNumber ` +
              `reuse, which could result in linking new features to previously deactivated data.`,
          );
          skippedCount++;
          continue;
        }

        // Update matched feature
        await matchedDootFeature.update(dootFeatureToSave, { transaction });
        console.log(
          `Updated Feature: ${parkFeatureName} (strapiOrcsFeatureNumber: ${orcsFeatureNumber})`,
        );
        updatedCount++;
      } else if (!useSafeMode) {
        // Create new feature
        await Feature.create(dootFeatureToSave, { transaction });
        console.log(
          `Created Feature: ${parkFeatureName} (strapiOrcsFeatureNumber: ${orcsFeatureNumber})`,
        );
        createdCount++;
      } else {
        console.warn(
          `Skipped inserting Feature due to safe mode: ${parkFeatureName} (orcsFeatureNumber: ${orcsFeatureNumber})`,
        );
        skippedCount++;
      }
    }

    // Create a Set of Strapi orcsFeatureNumbers for efficient lookup
    const strapiOrcsFeatureNumbers = new Set(
      strapiParkFeatures.map((pf) => pf.orcsFeatureNumber),
    );

    // loop through DOOT ParkFeatures to find any that are missing from Strapi data
    for (const dootParkFeature of dootFeatures) {
      if (
        !strapiOrcsFeatureNumbers.has(dootParkFeature.strapiOrcsFeatureNumber)
      ) {
        if (!useSafeMode) {
          // Deactivate the DOOT ParkFeature
          dootParkFeature.active = false;
          await dootParkFeature.save({ transaction });
          console.log(
            `Deactivated Feature: ${dootParkFeature.name} (strapiOrcsFeatureNumber: ${dootParkFeature.strapiOrcsFeatureNumber})`,
          );
          deactivatedCount++;
        } else {
          console.warn(
            `Skipped deactivating Feature due to safe mode: ${dootParkFeature.name} (strapiOrcsFeatureNumber: ${dootParkFeature.strapiOrcsFeatureNumber})`,
          );
          skippedCount++;
        }
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} Features`);
    console.log(`- Updated: ${updatedCount} Features`);
    console.log(`- Skipped: ${skippedCount} Features`);
    console.log(`- Deactivated: ${deactivatedCount} Features`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      deactivated: deactivatedCount,
    };
  } catch (error) {
    console.error("Error importing Features from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Feature.sequelize.transaction();

  try {
    const result = await importFeaturesFromStrapi(transaction);

    await transaction.commit();
    console.log("\nTransaction committed successfully");
    console.log(
      `Final counts - Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}, Deactivated: ${result.deactivated}`,
    );
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
