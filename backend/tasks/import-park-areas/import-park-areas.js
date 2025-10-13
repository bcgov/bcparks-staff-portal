import "../../env.js";

import { ParkArea } from "../../models/index.js";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

/**
 * Imports/updates ParkArea records from Strapi park-area data by matching orcsAreaNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importParkAreasFromStrapi(transaction = null) {
  try {
    console.log("Fetching park-area data from Strapi...");

    // Fetch all models from Strapi
    const strapiData = await fetchAllModels();

    // Get park-area data from Strapi
    const parkAreaData = getStrapiModelData(strapiData, "park-area");
    const strapiParkAreas = parkAreaData?.items || [];

    if (strapiParkAreas.length === 0) {
      console.log("No park-area data found in Strapi");
      return { created: 0, updated: 0 };
    }

    console.log(`Found ${strapiParkAreas.length} park areas in Strapi`);

    // Get all ParkAreas from DOOT to match against strapiOrcsAreaNumber
    const dootParkAreas = await ParkArea.findAll({
      attributes: ["id", "strapiOrcsAreaNumber"],
      transaction,
    });

    const parkAreasByOrcsAreaNumber = new Map(
      dootParkAreas.map((parkArea) => [
        parkArea.id,
        parkArea.strapiOrcsAreaNumber,
      ]),
    );

    console.log("parkAreasByOrcsAreaNumber", parkAreasByOrcsAreaNumber)

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const strapiParkArea of strapiParkAreas) {

      const {
        orcsAreaNumber,
        parkAreaName,
        isActive,
        inReservationSystem,
        protectedArea,
      } = strapiParkArea.attributes;

      // Get the parkId from the related protectedArea
      const parkId = protectedArea?.data?.id;


      // console.log("=== EXTRACTED CONSTANTS ===");
      // console.log("orcsAreaNumber:", orcsAreaNumber);
      // console.log("parkAreaName:", parkAreaName);
      // console.log("isActive:", isActive);
      // console.log("inReservationSystem:", inReservationSystem);
      // // console.log("protectedArea:", protectedArea)

      // console.log("=== DERIVED VALUES ===");
      // console.log("parkId from protectedArea?.data?.id:", parkId);

      // console.log("=== DOOT MAPPING DATA ===");
      // console.log("parkAreasByOrcsAreaNumber Map keys:", Array.from(parkAreasByOrcsAreaNumber.keys()));
      // console.log("matchingOrcsAreaNumber for", orcsAreaNumber, ":", parkAreasByOrcsAreaNumber.get(orcsAreaNumber));

      // console.log("========================\n");

      if (!orcsAreaNumber) {
        console.warn(
          `Skipping park area "${parkAreaName}" - no orcsAreaNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matching ParkArea in DOOT by orcsAreaNumber
      const matchingOrcsAreaNumber =
        parkAreasByOrcsAreaNumber.get(orcsAreaNumber);

      if (!matchingOrcsAreaNumber) {
        console.warn(
          `Skipping park area "${parkAreaName}" - no matching park found for orcsAreaNumber ${orcsAreaNumber}`,
        );
        skippedCount++;
        continue;
      }

      // Check if park area already exists in DOOT
      const existingParkArea = await ParkArea.findOne({
        where: {
          name: parkAreaName,
          strapiOrcsAreaNumber: matchingOrcsAreaNumber,
        },
        transaction,
      });

      const parkAreaToSave = {
        name: parkAreaName,
        strapiOrcsAreaNumber: matchingOrcsAreaNumber,
        active: isActive ?? true,
        inReservationSystem: inReservationSystem ?? false,
        parkId: parkId ?? null,
      };

      if (existingParkArea) {
        // Update existing park area
        await existingParkArea.update(parkAreaToSave, { transaction });
        console.log(`Updated park area: ${parkAreaName} (orcsAreaNumber: ${matchingOrcsAreaNumber})`);
        updatedCount++;
      } else {
        // Create new park area
        await ParkArea.create(parkAreaToSave, { transaction });
        console.log(`Created park area: ${parkAreaName} (orcsAreaNumber: ${matchingOrcsAreaNumber})`);
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} park areas`);
    console.log(`- Updated: ${updatedCount} park areas`);
    console.log(`- Skipped: ${skippedCount} park areas`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("Error importing park areas from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ParkArea.sequelize.transaction();

  try {
    const result = await importParkAreasFromStrapi(transaction);

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
