import "../env.js";
import { Park, Season } from "../models/index.js";

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

  // Run scripts to create seasons, winter seasons, and gate details

  // get the current season and the current winter season from the db
  const currentSeason = await Season.findOne({
    where: { seasonType: SEASON_TYPE.REGULAR },
    order: [["operatingYear", "DESC"]],
    transaction,
  });

  // The currentSeasonYear is one less than the greatest operatingYear for regular season.
  // This is because placeholders for group sites and picnic shelters for the next year exist in the database
  // (which have a much longer booking window), but the current regular season year is still considered
  // the year for which campsite dates are being entered.
  const currentSeasonYear = currentSeason
    ? currentSeason.operatingYear - 1
    : new Date().getFullYear();

  if (currentSeasonYear) {
    // run it for last year so we handle fall edge cases where two seasons are active at once
    await createSeasons(currentSeasonYear - 1, transaction);
    // run it for the current season year
    await createSeasons(currentSeasonYear, transaction);
  }

  const currentWinterSeason = await Season.findOne({
    where: { seasonType: SEASON_TYPE.WINTER },
    order: [["operatingYear", "DESC"]],
    transaction,
  });

  // Picnic shelters and group sites don't have winter seasons so we don't need to subtract 1
  const currentWinterSeasonYear = currentWinterSeason
    ? currentWinterSeason.operatingYear
    : new Date().getFullYear();

  if (currentWinterSeason) {
    // last year
    await createWinterSeasons(currentWinterSeasonYear - 1, transaction);
    // current year
    await createWinterSeasons(currentWinterSeason.operatingYear, transaction);
  }

  // create gate details for parks, park areas, and features
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
