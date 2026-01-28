import "../../env.js";

import _ from "lodash";
import { Op } from "sequelize";
import { Park, ManagementArea, Section } from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

/**
 * Retrieves and creates a lookup Map of management areas from DOOT ManagementArea
 * and Section records. These are structured in the format used in Park.managementAreas.
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Map>} A promise that resolves to a Map of management areas
 */
async function createManagementAreaLookup(transaction) {
  // Create a lookup of DOOT Sections by id
  const dootSections = await Section.findAll({
    transaction,
  });

  const sectionLookup = new Map(
    dootSections.map((section) => [
      section.id,
      {
        name: section.name,
        number: section.sectionNumber,
        id: section.id, // this used to be called strapiId but I don't think it was used anywhere
      },
    ]),
  );

  // Create a lookup of DOOT ManagementAreas by managementAreaNumber
  const dootManagementAreas = await ManagementArea.findAll({
    transaction,
  });

  return new Map(
    dootManagementAreas.map((ma) => [
      ma.managementAreaNumber,
      {
        mgmtArea: {
          name: ma.name,
          number: ma.managementAreaNumber,
          id: ma.id, // this used to be called strapiId but I don't think it was used anywhere
        },
        section: sectionLookup.get(ma.sectionId),
      },
    ]),
  );
}

/**
 * Imports/updates Park records from Strapi protected-area data by matching orcs
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiProtectedAreas(transaction = null) {
  try {
    // Get protected-area data from Strapi
    const protectedAreaData = await getStrapiModelData("protected-area");
    const strapiProtectedAreas = protectedAreaData?.items || [];

    if (strapiProtectedAreas.length === 0) {
      console.log("No protectedArea data found in Strapi");
      return { created: 0, updated: 0, skipped: 0, unchanged: 0 };
    }

    console.log(
      `Found ${strapiProtectedAreas.length} Active protectedAreas with parkOperations in Strapi`,
    );

    // Create management area lookup
    const managementAreaLookup = await createManagementAreaLookup(transaction);

    // Get all DOOT Parks for orcs lookup
    const dootParks = await Park.findAll({
      where: { orcs: { [Op.ne]: null } },
      transaction,
    });

    console.log(`Found ${dootParks.length} existing Parks in DOOT`);

    const parkLookup = new Map(
      dootParks.map((park) => [
        park.orcs, // Key: e.g. "1234"
        park, // Value: park
      ]),
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let unchangedCount = 0;

    for (const strapiProtectedArea of strapiProtectedAreas) {
      const { orcs, protectedAreaName, parkOperation, managementAreas } =
        strapiProtectedArea.attributes;

      const {
        inReservationSystem,
        hasWinterFeeDates,
        hasTier1Dates,
        hasTier2Dates,
      } = parkOperation?.data?.attributes || {};

      // get the managementAreas from Strapi
      const managementAreaArray = [];

      for (const managementArea of managementAreas.data) {
        const mgmtAreaNumber = managementArea.attributes.managementAreaNumber;
        const ma = managementAreaLookup.get(mgmtAreaNumber);

        if (ma) {
          managementAreaArray.push(ma);
        }
      }

      if (!orcs) {
        console.warn(
          `Skipping ProtectedArea: "${protectedAreaName}" - no orcs found`,
        );
        skippedCount++;
        continue;
      }

      // Get the parkId from the related Park
      const matchedDootPark = parkLookup.get(String(orcs));
      const parkId = matchedDootPark?.id ?? null;

      if (!parkId) {
        console.warn(
          `Skipping ProtectedArea: "${protectedAreaName}" - no matching Park found for related Protected Area orcs: ${orcs}`,
        );
        skippedCount++;
        continue;
      }

      const dootParkToSave = {
        name: protectedAreaName,
        orcs: String(orcs),
        inReservationSystem: inReservationSystem ?? false,
        hasWinterFeeDates: hasWinterFeeDates ?? false,
        hasTier1Dates: hasTier1Dates ?? false,
        hasTier2Dates: hasTier2Dates ?? false,
        managementAreas: managementAreaArray,
      };

      // Find matched ProtectedArea by strapiOrcsAreaNumber

      if (matchedDootPark) {
        // Check if any values are different
        const hasChanges = Object.keys(dootParkToSave).some((key) => {
          if (key === "managementAreas") {
            return !_.isEqual(matchedDootPark[key], dootParkToSave[key]);
          }
          return matchedDootPark[key] !== dootParkToSave[key];
        });

        if (hasChanges) {
          // Update matched park area
          await matchedDootPark.update(dootParkToSave, {
            transaction,
          });

          console.log(`Updated Park: ${protectedAreaName} (orcs: ${orcs})`);
          updatedCount++;
        } else {
          unchangedCount++;
        }
      } else {
        // Create new park area
        await Park.create(dootParkToSave, { transaction });
        console.log(`Created Park: ${protectedAreaName} (orcs: ${orcs})`);
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} Parks`);
    console.log(`- Updated: ${updatedCount} Parks`);
    console.log(`- Unchanged: ${unchangedCount} Parks`);
    console.log(`- Skipped (invalid): ${skippedCount} Parks`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      unchanged: unchangedCount,
    };
  } catch (error) {
    console.error("Error importing ProtectedAreas from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Park.sequelize.transaction();

  try {
    const result = await importStrapiProtectedAreas(transaction);

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
