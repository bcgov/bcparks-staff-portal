import "../../env.js";

import { Op } from "sequelize";
import { Park, ParkArea } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";
import {
  validateDootParkAreas,
  validateStrapiParkAreas,
} from "./validation.js";

/**
 * Imports/updates ParkArea records from Strapi park-area data by matching orcsAreaNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiParkAreas(transaction = null) {
  try {
    // Get park-area data from Strapi
    const parkAreaData = await getStrapiModelData("park-area");
    const strapiParkAreas = parkAreaData?.items || [];

    if (strapiParkAreas.length === 0) {
      console.log("No ParkArea data found in Strapi");
      return { created: 0, skipped: 0, updated: 0 };
    }

    console.log(`Found ${strapiParkAreas.length} ParkAreas in Strapi`);

    // Validate Park Areas in DOOT and Strapi
    const strapiValid = await validateStrapiParkAreas(strapiParkAreas);
    const dootValid = await validateDootParkAreas();

    let useSafeMode = false;

    if (!dootValid || !strapiValid) {
      useSafeMode = true;
      console.warn(
        "Validation failed. Running in safe mode: only updates allowed, no inserts or deactivations.",
      );
    }

    // Get all DOOT ParkAreas for strapiOrcsAreaNumber lookup
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

    console.log(`Found ${dootParkAreas.length} existing ParkAreas in DOOT`);

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

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let deactivatedCount = 0;
    let unchangedCount = 0;

    for (const strapiParkArea of strapiParkAreas) {
      const {
        orcsAreaNumber,
        parkAreaName,
        isActive,
        inReservationSystem,
        protectedArea,
      } = strapiParkArea;

      // Get the parkId from the related protectedArea
      let parkId = null;
      const protectedAreaOrcs = (protectedArea || {}).orcs;

      if (protectedAreaOrcs) {
        const protectedAreaOrcsString = String(protectedAreaOrcs);
        const matchedPark = parkLookup.get(protectedAreaOrcsString) ?? null;

        parkId = matchedPark?.id ?? null;
      }

      if (!parkId) {
        console.warn(
          `Skipping ParkArea: "${parkAreaName}" - no matching Park found for related Protected Area orcs: ${protectedAreaOrcs}`,
        );
        skippedCount++;
        continue;
      }

      if (!orcsAreaNumber) {
        console.warn(
          `Skipping ParkArea: "${parkAreaName}" - no orcsAreaNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ParkArea by strapiOrcsAreaNumber
      const matchedDootParkArea = parkAreaLookup.get(orcsAreaNumber);

      const dootParkAreaToSave = {
        name: parkAreaName,
        strapiOrcsAreaNumber: orcsAreaNumber,
        active: isActive ?? false,
        inReservationSystem: inReservationSystem ?? false,
        parkId,
      };

      if (matchedDootParkArea) {
        if (isActive && !matchedDootParkArea.active) {
          if (
            matchedDootParkArea.name.toLowerCase().trim() ===
            parkAreaName.toLowerCase().trim()
          ) {
            // Names match, allow reactivation
          } else {
            console.warn(
              `\nSkipping reactivation of park area: ${parkAreaName} (${orcsAreaNumber}). ` +
                `This park area is active in Strapi but inactive in DOOT. To reactivate, ` +
                `either activate it manually via AdminJS or assign a new orcsAreaNumber in ` +
                `Strapi. This is a safety measure to avoid orcsAreaNumber reuse, which could ` +
                `result in linking new park areas to previously deactivated data. ` +
                `NOTE: If the park area names match, this check is bypassed.\n`,
            );
            skippedCount++;
            continue;
          }
        }

        // Check if any values are different
        const hasChanges = Object.keys(dootParkAreaToSave).some(
          (key) => matchedDootParkArea[key] !== dootParkAreaToSave[key],
        );

        if (hasChanges) {
          // Update counts based on activation status
          if (matchedDootParkArea.active && !isActive) {
            deactivatedCount++;
          } else {
            updatedCount++;
          }
          // Update matched park area
          await matchedDootParkArea.update(dootParkAreaToSave, { transaction });
          console.log(
            `Updated ParkArea: ${parkAreaName} (strapiOrcsAreaNumber: ${orcsAreaNumber})`,
          );
        } else {
          unchangedCount++;
        }
      } else if (!useSafeMode) {
        // Create new park area
        await ParkArea.create(dootParkAreaToSave, { transaction });
        console.log(
          `Created ParkArea: ${parkAreaName} (strapiOrcsAreaNumber: ${orcsAreaNumber})`,
        );
        createdCount++;
      } else {
        console.warn(
          `Skipped inserting ParkArea due to safe mode: ${parkAreaName} (orcsAreaNumber: ${orcsAreaNumber})`,
        );
        skippedCount++;
      }
    }

    // Create a Set of Strapi orcsAreaNumbers for efficient lookup
    const strapiOrcsAreaNumbers = new Set(
      strapiParkAreas.map((pa) => pa.orcsAreaNumber),
    );

    // loop through DOOT ParkAreas to find any that are missing from Strapi data
    for (const dootParkArea of dootParkAreas) {
      if (!strapiOrcsAreaNumbers.has(dootParkArea.strapiOrcsAreaNumber)) {
        if (!useSafeMode) {
          // Deactivate the DOOT ParkArea
          if (dootParkArea.active) {
            dootParkArea.active = false;
            await dootParkArea.save({ transaction });
            console.log(
              `Deactivated ParkArea: ${dootParkArea.name} (strapiOrcsAreaNumber: ${dootParkArea.strapiOrcsAreaNumber})`,
            );
            deactivatedCount++;
          }
        } else {
          console.warn(
            `Skipped deactivating ParkArea due to safe mode: ${dootParkArea.name} (strapiOrcsAreaNumber: ${dootParkArea.strapiOrcsAreaNumber})`,
          );
          skippedCount++;
        }
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} ParkAreas`);
    console.log(`- Updated: ${updatedCount} ParkAreas`);
    console.log(`- Unchanged: ${unchangedCount} ParkAreas`);
    console.log(`- Deactivated: ${deactivatedCount} ParkAreas`);
    console.log(`- Skipped (invalid): ${skippedCount} ParkAreas`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      deactivated: deactivatedCount,
      unchanged: unchangedCount,
    };
  } catch (error) {
    console.error("Error importing ParkAreas from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ParkArea.sequelize.transaction();

  try {
    const result = await importStrapiParkAreas(transaction);

    await transaction.commit();
    console.log("\nTransaction committed successfully");
    console.log(
      `Final counts - Created: ${result.created}, Updated: ${result.updated}, Deactivated: ${result.deactivated}, Skipped: ${result.skipped}`,
    );
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
