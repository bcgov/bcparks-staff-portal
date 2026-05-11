import "../env.js";
import { Park } from "../models/index.js";
import importStrapiSections from "./import-sections/import-sections.js";
import importStrapiManagementAreas from "./import-management-areas/import-management-areas.js";
import importStrapiParkAreaTypes from "./import-park-area-types/import-park-area-types.js";
import importStrapiParkAreas from "./import-park-areas/import-park-areas.js";
import importStrapiFeatureTypes from "./import-feature-types/import-feature-types.js";
import importStrapiFeatures from "./import-features/import-features.js";
import importStrapiProtectedAreas from "./import-parks/import-parks.js";
import importStrapiDateTypes from "./import-date-types/import-date-types.js";

/**
 * Syncs data from Strapi to our database
 * Focuses on sections, managementAreas, dateTypes, parks, parkAreaTypes, parkAreas,
 * featureTypes, and features
 * @param {Transaction} transaction Sequelize transaction
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncData(transaction) {
  await importStrapiSections(transaction);
  await importStrapiManagementAreas(transaction);
  await importStrapiDateTypes(transaction);
  await importStrapiProtectedAreas(transaction);
  await importStrapiParkAreaTypes(transaction);
  await importStrapiParkAreas(transaction);
  await importStrapiFeatureTypes(transaction);
  await importStrapiFeatures(transaction);
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Park.sequelize.transaction();

  try {
    await syncData(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
