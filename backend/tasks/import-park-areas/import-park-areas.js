import "../../env.js";

import { Park, ParkArea } from "../../models/index.js";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

/**
 * Imports/updates ParkArea records from Strapi park-area data by matching orcsAreaNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importParkAreasFromStrapi(transaction = null) {
  try {
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

    // Get all DOOT ParkAreas for strapiOrcsAreaNumber
    const dootParkAreas = await ParkArea.findAll({ transaction });
    const parkAreaLookup = new Map(
      dootParkAreas
        .filter((parkArea) => parkArea.strapiOrcsAreaNumber)
        .map((parkArea) => [
          parkArea.strapiOrcsAreaNumber, // Key: e.g. "1234-1"
          parkArea, // Value: ParkArea record
        ]),
    );

    console.log(`Found ${dootParkAreas.length} existing park areas in DOOT`);

    // Get all DOOT Parks for orcs lookup
    const dootParks = await Park.findAll({ transaction });
    const parkLookup = new Map(
      dootParks
        .filter((park) => park.orcs)
        .map((park) => [
          park.orcs, // Key: e.g. "1234"
          park, // Value: park
        ]),
    );

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
      let parkId = null;
      const protectedAreaOrcs = String(protectedArea?.data?.attributes.orcs);

      if (protectedAreaOrcs) {
        const matchedPark = parkLookup.get(protectedAreaOrcs) ?? null;

        parkId = matchedPark?.id ?? null;
      }

      if (!orcsAreaNumber) {
        console.warn(
          `Skipping park area "${parkAreaName}" - no orcsAreaNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ParkArea by strapiOrcsAreaNumber
      const matchedParkArea = parkAreaLookup.get(orcsAreaNumber);

      const parkAreaToSave = {
        name: parkAreaName,
        strapiOrcsAreaNumber: orcsAreaNumber,
        active: isActive ?? true,
        inReservationSystem: inReservationSystem ?? false,
        parkId,
      };

      if (matchedParkArea) {
        // Update matched park area
        await matchedParkArea.update(parkAreaToSave, { transaction });
        console.log(
          `Updated park area: ${parkAreaName} (strapiOrcsAreaNumber: ${orcsAreaNumber})`,
        );
        updatedCount++;
      } else {
        // Create new park area
        await ParkArea.create(parkAreaToSave, { transaction });
        console.log(
          `Created park area: ${parkAreaName} (strapiOrcsAreaNumber: ${orcsAreaNumber})`,
        );
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
