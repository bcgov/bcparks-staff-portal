import "../../env.js";

import { Op } from "sequelize";
import { Section } from "../../models/index.js";
import { getStrapiModelData } from "../strapi-data-service.js";

/**
 * Imports/updates Section records from Strapi section data by matching sectionNumber
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} Object containing counts of created and updated records
 */
export default async function importStrapiSections(transaction = null) {
  console.log("STARTING IMPORT OF SECTIONS FROM STRAPI\n");
  try {
    // Get section data from Strapi
    const sectionData = await getStrapiModelData("section");
    const strapiSections = sectionData?.items || [];

    if (strapiSections.length === 0) {
      console.log("No section data found in Strapi");
      return { created: 0, updated: 0, skipped: 0, unchanged: 0 };
    }

    // Get all DOOT Sections for sectionNumber lookup
    const dootSections = await Section.findAll({
      where: { sectionNumber: { [Op.ne]: null } },
      transaction,
    });
    const sectionLookup = new Map(
      dootSections.map((section) => [
        section.sectionNumber, // Key: e.g. "10"
        section, // Value: Section record
      ]),
    );

    console.log(`Found ${dootSections.length} existing sections in DOOT`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let unchangedCount = 0;

    for (const strapiSection of strapiSections) {
      const { sectionName, sectionNumber } = strapiSection;

      if (!sectionNumber) {
        console.warn(
          `Skipping section "${sectionName}" - no sectionNumber found`,
        );
        skippedCount++;
        continue;
      }

      // Find matched Section by sectionNumber
      const matchedSection = sectionLookup.get(sectionNumber);

      const sectionToSave = {
        name: sectionName,
        sectionNumber,
      };

      if (matchedSection) {
        // check if any fields have changed
        const hasChanges = Object.keys(sectionToSave).some(
          (key) => matchedSection[key] !== sectionToSave[key],
        );

        if (!hasChanges) {
          unchangedCount++;
          continue;
        }

        // Update matched section
        await matchedSection.update(sectionToSave, { transaction });
        console.log(
          `Updated section: ${sectionName} (sectionNumber: ${sectionNumber})`,
        );
        updatedCount++;
      } else {
        // Create new section
        await Section.create(sectionToSave, { transaction });
        console.log(
          `Created section: ${sectionName} (sectionNumber: ${sectionNumber})`,
        );
        createdCount++;
      }
    }

    console.log(`\nImport complete:`);
    console.log(`- Created: ${createdCount} sections`);
    console.log(`- Updated: ${updatedCount} sections`);
    console.log(`- Unchanged: ${unchangedCount} sections`);
    console.log(`- Skipped (invalid): ${skippedCount} sections\n\n`);

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      unchanged: unchangedCount,
    };
  } catch (error) {
    console.error("Error importing sections from Strapi:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Section.sequelize.transaction();

  try {
    await importStrapiSections(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
