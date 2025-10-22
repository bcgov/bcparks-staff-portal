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
      console.log("No park-feature data found in Strapi");
      return { created: 0, skipped: 0, updated: 0 };
    }

    console.log(`Found ${strapiParkFeatures.length} park features in Strapi`);

    // Validate Features in DOOT and Strapi
    const dootValid = await validateDootFeatures();
    const strapiValid = validateStrapiFeatures(strapiParkFeatures);

    if (!dootValid || !strapiValid) {
      return { created: 0, skipped: 0, updated: 0 };
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

    console.log(`Found ${dootFeatures.length} existing features in DOOT`);

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

    // Get all DOOT Park areas for orcAreaNumber lookup
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
      } = strapiParkFeature.attributes;

      // Get the parkId from the related protectedArea
      let parkId = null;
      const protectedAreaOrcs = protectedArea?.data?.attributes.orcs;

      if (protectedAreaOrcs !== null) {
        const protectedAreaOrcsString = String(protectedAreaOrcs);
        const matchedPark = parkLookup.get(protectedAreaOrcsString) ?? null;

        parkId = matchedPark?.id ?? null;
      }

      // Get the parkAreaId from the related parkArea
      let parkAreaId = null;
      const orcsParkAreaNumber = parkArea?.data?.attributes.orcsAreaNumber;

      if (parkArea !== null) {
        const matchedParkArea = parkAreaLookup.get(orcsParkAreaNumber) ?? null;

        parkAreaId = matchedParkArea?.id ?? null;
      }

      // Get the featureTypeId from the related parkFeatureType
      let featureTypeId = null;
      const strapiFeatureTypeId =
        parkFeatureType?.data?.attributes.featureTypeId;

      if (parkFeatureType !== null) {
        const matchedFeatureType =
          featureTypeLookup.get(strapiFeatureTypeId) ?? null;

        featureTypeId = matchedFeatureType?.id ?? null;
      }

      if (!orcsFeatureNumber) {
        console.warn(
          `Skipping feature "${parkFeatureName}" - no orcsFeatureNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ParkFeature by strapiOrcsFeatureNumber
      const matchedFeature = featureLookup.get(orcsFeatureNumber);

      const featureToSave = {
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

      if (matchedFeature) {
        // Update matched feature
        await matchedFeature.update(featureToSave, { transaction });
        console.log(
          `Updated feature: ${parkFeatureName} (strapiOrcsFeatureNumber: ${orcsFeatureNumber})`,
        );
        updatedCount++;
      } else {
        // Create new feature
        await Feature.create(featureToSave, { transaction });
        console.log(
          `Created feature: ${parkFeatureName} (strapiOrcsFeatureNumber: ${orcsFeatureNumber})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} features`);
    console.log(`- Updated: ${updatedCount} features`);
    console.log(`- Skipped: ${skippedCount} features`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("Error importing features from Strapi:", error);
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
      `Final counts - Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
    );
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
