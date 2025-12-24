import "../../env.js";

import { Op } from "sequelize";
import { DateType } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

/**
 * Imports/updates DateType records from Strapi park-date-type data by matching dateTypeId
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiDateTypes(transaction = null) {
  try {
    // Get park-date-type data from Strapi
    const dateTypeData = await getStrapiModelData("park-date-type");
    const strapiDateTypes = dateTypeData?.items || [];

    if (strapiDateTypes.length === 0) {
      console.log("No park-date-type data found in Strapi");
      return { created: 0, skipped: 0, updated: 0 };
    }

    console.log(`Found ${strapiDateTypes.length} park date types in Strapi`);

    // Get all DOOT DateTypes for strapiDateTypeId lookup
    const dootDateTypes = await DateType.findAll({
      where: { strapiDateTypeId: { [Op.ne]: null } },
      transaction,
    });
    const dateTypeLookup = new Map(
      dootDateTypes.map((dateType) => [
        dateType.strapiDateTypeId, // Key: e.g. "10"
        dateType, // Value: DateType record
      ]),
    );

    console.log(`Found ${dootDateTypes.length} existing date types in DOOT`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const strapiDateType of strapiDateTypes) {
      const { dateType, dateTypeId } = strapiDateType;

      if (!dateTypeId) {
        console.warn(`Skipping date type "${dateType}" - no dateTypeId found`);
        skippedCount++;
        continue;
      }

      // Find matched DateType by dateTypeId
      const matchedDateType = dateTypeLookup.get(dateTypeId);

      const dateTypeToSave = {
        name: dateType,
        strapiDateTypeId: dateTypeId,
        description: strapiDateType.description,
        parkAreaLevel: strapiDateType.parkAreaLevel || false,
        featureLevel: strapiDateType.featureLevel || false,
        parkLevel: strapiDateType.parkLevel || false,
        startDateLabel: strapiDateType.startDateLabel,
        endDateLabel: strapiDateType.endDateLabel,
      };

      if (matchedDateType) {
        // check if any fields have changed
        const hasChanges = Object.keys(dateTypeToSave).some(
          (key) => matchedDateType[key] !== dateTypeToSave[key],
        );

        if (!hasChanges) {
          skippedCount++;
          continue;
        }

        // Update matched date type
        await matchedDateType.update(dateTypeToSave, { transaction });
        console.log(
          `Updated date type: ${dateType} (strapiDateTypeId: ${dateTypeId})`,
        );
        updatedCount++;
      } else {
        // Create new date type
        await DateType.create(dateTypeToSave, { transaction });
        console.log(
          `Created date type: ${dateType} (strapiDateTypeId: ${dateTypeId})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} date types`);
    console.log(`- Updated: ${updatedCount} date types`);
    console.log(`- Skipped: ${skippedCount} date types`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("Error importing date types from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await DateType.sequelize.transaction();

  try {
    const result = await importStrapiDateTypes(transaction);

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
