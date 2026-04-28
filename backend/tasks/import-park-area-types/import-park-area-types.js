import "../../env.js";

import { Op } from "sequelize";
import { ParkAreaType } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

/**
 * Imports/updates ParkAreaType records from Strapi park-area-type data by matching areaTypeId
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiParkAreaTypes(transaction = null) {
  try {
    // Get park-area-type data from Strapi
    const parkAreaTypeData = await getStrapiModelData("park-area-type");
    const strapiParkAreaTypes = parkAreaTypeData?.items || [];

    if (strapiParkAreaTypes.length === 0) {
      console.log("No park-area-type data found in Strapi");
      return { created: 0, updated: 0, skipped: 0, unchanged: 0 };
    }

    console.log(
      `Found ${strapiParkAreaTypes.length} park area types in Strapi`,
    );

    // Get all DOOT ParkAreaTypes for parkAreaTypeNumber lookup
    const dootParkAreaTypes = await ParkAreaType.findAll({
      where: { parkAreaTypeNumber: { [Op.ne]: null } },
      transaction,
    });
    const parkAreaTypeLookup = new Map(
      dootParkAreaTypes.map((parkAreaType) => [
        parkAreaType.parkAreaTypeNumber, // Key: e.g. "10"
        parkAreaType, // Value: ParkAreaType record
      ]),
    );

    console.log(
      `Found ${dootParkAreaTypes.length} existing park area types in DOOT`,
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let unchangedCount = 0;

    for (const strapiParkAreaType of strapiParkAreaTypes) {
      const { parkAreaType, areaTypeId, rank } = strapiParkAreaType;

      if (!areaTypeId) {
        console.warn(
          `Skipping park area type "${parkAreaType}" - no areaTypeId found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ParkAreaType by areaTypeId
      const matchedParkAreaType = parkAreaTypeLookup.get(areaTypeId);

      const parkAreaTypeToSave = {
        name: parkAreaType,
        parkAreaTypeNumber: areaTypeId,
        rank: rank || 1000000,
      };

      if (matchedParkAreaType) {
        // check if any fields have changed
        const hasChanges = Object.keys(parkAreaTypeToSave).some(
          (key) => matchedParkAreaType[key] !== parkAreaTypeToSave[key],
        );

        if (!hasChanges) {
          unchangedCount++;
          continue;
        }

        // Update matched park area type
        await matchedParkAreaType.update(parkAreaTypeToSave, { transaction });
        console.log(
          `Updated park area type: ${parkAreaType} (parkAreaTypeNumber: ${areaTypeId})`,
        );
        updatedCount++;
      } else {
        // Create new park area type
        await ParkAreaType.create(parkAreaTypeToSave, { transaction });
        console.log(
          `Created park area type: ${parkAreaType} (parkAreaTypeNumber: ${areaTypeId})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} park area types`);
    console.log(`- Updated: ${updatedCount} park area types`);
    console.log(`- Unchanged: ${unchangedCount} park area types`);
    console.log(`- Skipped (invalid): ${skippedCount} park area types`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      unchanged: unchangedCount,
    };
  } catch (error) {
    console.error("Error importing park area types from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ParkAreaType.sequelize.transaction();

  try {
    const result = await importStrapiParkAreaTypes(transaction);

    await transaction.commit();
    console.log("\nTransaction committed successfully");
    console.log(
      `Final counts - Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}, Unchanged: ${result.unchanged}`,
    );
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
