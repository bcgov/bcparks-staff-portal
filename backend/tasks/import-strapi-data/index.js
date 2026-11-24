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
import deleteStaleWinterFeeDates from "./delete-stale-winter-fee-dates.js";

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

  const parkImport = await importStrapiProtectedAreas(transaction);

  await importStrapiParkAreaTypes(transaction);

  const parkAreaImport = await importStrapiParkAreas(transaction);

  await importStrapiFeatureTypes(transaction);

  const featureImport = await importStrapiFeatures(transaction);

  // Delete ranges only for records returned by this Strapi sync.
  await deleteStaleWinterFeeDates(
    [
      ...(parkImport?.dateableIdsWithWinterFeesDisabled ?? []),
      ...(parkAreaImport?.dateableIdsWithWinterFeesDisabled ?? []),
      ...(featureImport?.dateableIdsWithWinterFeesDisabled ?? []),
    ],
    transaction,
  );
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
