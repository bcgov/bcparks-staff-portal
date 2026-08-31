import "../env.js";
import { Park } from "../models/index.js";
import { getCurrentDateCollectionYear } from "../utils/operatingYearHelper.js";

import * as SEASON_TYPE from "../constants/seasonType.js";
import importStrapiSections from "./import-sections/import-sections.js";
import importStrapiManagementAreas from "./import-management-areas/import-management-areas.js";
import importStrapiParkAreaTypes from "./import-park-area-types/import-park-area-types.js";
import importStrapiParkAreas from "./import-park-areas/import-park-areas.js";
import importStrapiFeatureTypes from "./import-feature-types/import-feature-types.js";
import importStrapiFeatures from "./import-features/import-features.js";
import importStrapiProtectedAreas from "./import-parks/import-parks.js";
import importStrapiDateTypes from "./import-date-types/import-date-types.js";

import createSeasons from "../tasks/create-seasons/create-seasons.js";
import createWinterSeasons from "../tasks/create-winter-seasons/create-winter-seasons.js";
import createGateDetails from "../tasks/create-gate-details/create-gate-details.js";

/**
 * Syncs data from Strapi to our database
 * Focuses on sections, managementAreas, dateTypes, parks, parkAreaTypes, parkAreas,
 * featureTypes, and features
 * @param {Transaction} transaction Sequelize transaction
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncData(transaction) {
  // Import data from Strapi

  await importStrapiSections(transaction);
  await importStrapiManagementAreas(transaction);
  await importStrapiDateTypes(transaction);
  await importStrapiProtectedAreas(transaction);
  await importStrapiParkAreaTypes(transaction);
  await importStrapiParkAreas(transaction);
  await importStrapiFeatureTypes(transaction);
  await importStrapiFeatures(transaction);

  // Run script to create seasons
  const currentDateCollectionYear = await getCurrentDateCollectionYear(
    SEASON_TYPE.REGULAR,
    transaction,
  );

  // last year
  await createSeasons(currentDateCollectionYear - 1, transaction);
  // current year
  await createSeasons(currentDateCollectionYear, transaction);

  // Run script to create winter seasons
  const currentWinterDateCollectionYear = await getCurrentDateCollectionYear(
    SEASON_TYPE.WINTER,
    transaction,
  );

  // last year
  await createWinterSeasons(currentWinterDateCollectionYear - 1, transaction);
  // current year
  await createWinterSeasons(currentWinterDateCollectionYear, transaction);

  // Run script to create gate details
  await createGateDetails(transaction);
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
