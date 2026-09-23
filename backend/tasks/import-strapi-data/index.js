import "../../env.js";
import { Park } from "../../models/index.js";

import importStrapiSections from "./sections/import-sections.js";
import importStrapiManagementAreas from "./management-areas/import-management-areas.js";
import importStrapiParkAreaTypes from "./park-area-types/import-park-area-types.js";
import importStrapiParkAreas from "./park-areas/import-park-areas.js";
import importStrapiFeatureTypes from "./feature-types/import-feature-types.js";
import importStrapiFeatures from "./features/import-features.js";
import importStrapiProtectedAreas from "./parks/import-parks.js";
import importStrapiDateTypes from "./date-types/import-date-types.js";

/**
 * Syncs data from Strapi to our database
 * Focuses on sections, managementAreas, dateTypes, parks, parkAreaTypes, parkAreas,
 * featureTypes, and features
 * @param {Transaction} transaction Sequelize transaction
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncStrapiData(transaction) {
  // Import data from Strapi

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
    await syncStrapiData(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
