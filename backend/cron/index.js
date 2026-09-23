import "../env.js";

import * as SEASON_TYPE from "../constants/seasonType.js";
import { Park } from "../models/index.js";
import { getCurrentDateCollectionYear } from "../utils/operatingYearHelper.js";

import { syncStrapiData } from "../tasks/import-strapi-data/index.js";
import createSeasons from "../tasks/create-seasons/create-seasons.js";
import createWinterSeasons from "../tasks/create-winter-seasons/create-winter-seasons.js";
import createGateDetails from "../tasks/create-gate-details/create-gate-details.js";

/**
 * Runs the scheduled data-maintenance jobs in a single transaction.
 * Imports Strapi data, ensures regular and winter seasons and date ranges exist
 * for newly imported entities, and ensures gate-detail records exist.
 * @param {Transaction} transaction Sequelize transaction
 * @returns {Promise<void>} Resolves when all jobs have completed
 */
export async function runAllJobs(transaction) {
  // Import data from Strapi
  await syncStrapiData(transaction);

  // Ensure seasons and date ranges exist for newly imported entities.
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

  // Ensure gate-detail records exist for newly imported entities.
  await createGateDetails(transaction);
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Park.sequelize.transaction();

  try {
    await runAllJobs(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
