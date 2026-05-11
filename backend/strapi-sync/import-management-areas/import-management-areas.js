import "../../env.js";

import { Op } from "sequelize";
import { Section, ManagementArea } from "../../models/index.js";
import { getStrapiModelData } from "../strapi-data-service.js";

/**
 * Imports/updates ManagementArea records from Strapi management area data by matching managementAreaNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiManagementAreas(transaction = null) {
  console.log("STARTING IMPORT OF MANAGEMENT AREAS FROM STRAPI\n");
  try {
    // Get management area data from Strapi
    const managementAreaData = await getStrapiModelData("management-area");
    const strapiManagementAreas = managementAreaData?.items || [];

    if (strapiManagementAreas.length === 0) {
      console.log("No management area data found in Strapi");
      return { created: 0, updated: 0, skipped: 0, unchanged: 0 };
    }

    // Get all DOOT Sections for sectionNumber lookup of sectionId foreign key
    const dootSections = await Section.findAll({
      where: { sectionNumber: { [Op.ne]: null } },
      transaction,
    });

    const sectionLookup = new Map(
      dootSections.map((section) => [section.sectionNumber, section.id]),
    );

    // Get all DOOT ManagementAreas for managementAreaNumber lookup
    const dootMgmtAreas = await ManagementArea.findAll({
      where: { managementAreaNumber: { [Op.ne]: null } },
      transaction,
    });
    const mgmtAreaLookup = new Map(
      dootMgmtAreas.map((mgmtArea) => [
        mgmtArea.managementAreaNumber, // Key: e.g. 10
        mgmtArea, // Value: ManagementArea record
      ]),
    );

    console.log(
      `Found ${dootMgmtAreas.length} existing management areas in DOOT`,
    );

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let unchangedCount = 0;

    for (const strapiManagementArea of strapiManagementAreas) {
      const { managementAreaName, managementAreaNumber } = strapiManagementArea;

      if (!managementAreaNumber) {
        console.warn(
          `Skipping management area "${managementAreaName}" - no managementAreaNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched ManagementArea by managementAreaNumber
      const matchedMgmtArea = mgmtAreaLookup.get(managementAreaNumber);

      // Find matched Section by sectionNumber
      const sectionNumber = strapiManagementArea.section?.sectionNumber;
      const sectionId = sectionNumber ? sectionLookup.get(sectionNumber) : null;

      if (!sectionId) {
        console.warn(
          `Skipping management area "${managementAreaName}" - no section found for section number "${sectionNumber}"`,
        );
        skippedCount++;
        continue;
      }

      const mgmtAreaToSave = {
        name: managementAreaName,
        managementAreaNumber,
        sectionId,
      };

      if (matchedMgmtArea) {
        // check if any fields have changed
        const hasChanges = Object.keys(mgmtAreaToSave).some(
          (key) => matchedMgmtArea[key] !== mgmtAreaToSave[key],
        );

        if (!hasChanges) {
          unchangedCount++;
          continue;
        }

        // Update matched management area
        await matchedMgmtArea.update(mgmtAreaToSave, { transaction });
        console.log(
          `Updated management area: ${managementAreaName} (managementAreaNumber: ${managementAreaNumber})`,
        );
        updatedCount++;
      } else {
        await ManagementArea.create(mgmtAreaToSave, { transaction });
        console.log(
          `Created management area: ${managementAreaName} (managementAreaNumber: ${managementAreaNumber})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} management areas`);
    console.log(`- Updated: ${updatedCount} management areas`);
    console.log(`- Unchanged: ${unchangedCount} management areas`);
    console.log(`- Skipped (invalid): ${skippedCount} management areas\n\n`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      unchanged: unchangedCount,
    };
  } catch (error) {
    console.error("Error importing management areas from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ManagementArea.sequelize.transaction();

  try {
    await importStrapiManagementAreas(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
