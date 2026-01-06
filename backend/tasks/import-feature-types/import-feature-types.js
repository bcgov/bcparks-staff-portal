import "../../env.js";

import { Op } from "sequelize";
import { FeatureType } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

/**
 * Imports/updates FeatureType records from Strapi park-feature-type data by matching featureTypeId
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiFeatureTypes(transaction = null) {
  try {
    // Get park-feature-type data from Strapi
    const featureTypeData = await getStrapiModelData("park-feature-type");
    const strapiFeatureTypes = featureTypeData?.items || [];

    if (strapiFeatureTypes.length === 0) {
      console.log("No park-feature-type data found in Strapi");
      return { created: 0, skipped: 0, updated: 0 };
    }

    console.log(
      `Found ${strapiFeatureTypes.length} park feature types in Strapi`,
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

    console.log(
      `Found ${dootFeatureTypes.length} existing feature types in DOOT`,
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const strapiFeatureType of strapiFeatureTypes) {
      const { parkFeatureType, featureTypeId } = strapiFeatureType;

      if (!featureTypeId) {
        console.warn(
          `Skipping feature type "${parkFeatureType}" - no featureTypeId found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched FeatureType by featureTypeId
      const matchedFeatureType = featureTypeLookup.get(featureTypeId);

      const featureTypeToSave = {
        name: parkFeatureType,
        strapiFeatureTypeId: featureTypeId,
      };

      if (matchedFeatureType) {
        // check if any fields have changed
        const hasChanges = Object.keys(featureTypeToSave).some(
          (key) => matchedFeatureType[key] !== featureTypeToSave[key],
        );

        if (!hasChanges) {
          skippedCount++;
          continue;
        }

        // Update matched feature type
        await matchedFeatureType.update(featureTypeToSave, { transaction });
        console.log(
          `Updated feature type: ${parkFeatureType} (strapiFeatureTypeId: ${featureTypeId})`,
        );
        updatedCount++;
      } else {
        // Default the icon to 'information' so it shows a questionmark until set
        featureTypeToSave.icon = "information";

        // Create new feature type
        await FeatureType.create(featureTypeToSave, { transaction });
        console.log(
          `Created feature type: ${parkFeatureType} (strapiFeatureTypeId: ${featureTypeId})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} feature types`);
    console.log(`- Updated: ${updatedCount} feature types`);
    console.log(`- Skipped: ${skippedCount} feature types`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("Error importing feature types from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await FeatureType.sequelize.transaction();

  try {
    const result = await importStrapiFeatureTypes(transaction);

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
