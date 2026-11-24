import "../env.js";

import * as SEASON_TYPE from "../constants/seasonType.js";
import { createTransactionWithRetry } from "../db/transaction.js";
import { getCurrentDateCollectionYear } from "../utils/operatingYearHelper.js";

import { syncStrapiData } from "../tasks/import-strapi-data/index.js";
import createSeasons from "../tasks/create-seasons/create-seasons.js";
import createWinterSeasons from "../tasks/create-winter-seasons/create-winter-seasons.js";
import createGateDetails from "../tasks/create-gate-details/create-gate-details.js";
import propagateWinterFeeDates, {
  clearWinterFeeDatesForUnflaggedParks,
} from "../utils/propagateWinterFeeDates.js";
import { queueEmailReminders } from "../tasks/queue-email-reminders/queue-email-reminders.js";

/**
 * Runs the scheduled data-maintenance jobs in a single transaction.
 * Imports Strapi data, ensures regular and winter seasons and date ranges exist
 * for newly imported entities, recalculates derived Feature winter fee dates
 * (clearing stale ones), and ensures gate-detail records exist.
 * @returns {Promise<void>} Resolves when all jobs have completed
 */
async function runAllJobs() {
  let transaction;

  try {
    transaction = await createTransactionWithRetry();

    // Import data from Strapi.
    await syncStrapiData(transaction);

    // Ensure seasons and date ranges exist for newly imported entities.
    const currentDateCollectionYear = await getCurrentDateCollectionYear(
      SEASON_TYPE.REGULAR,
      transaction,
    );

    await createSeasons(currentDateCollectionYear - 1, transaction);
    await createSeasons(currentDateCollectionYear, transaction);

    // Ensure winter seasons and date ranges exist for newly imported entities.
    const currentWinterDateCollectionYear = await getCurrentDateCollectionYear(
      SEASON_TYPE.WINTER,
      transaction,
    );

    for (const winterYear of [
      currentWinterDateCollectionYear - 1,
      currentWinterDateCollectionYear,
    ]) {
      const { parkWinterSeasonIds = [] } = await createWinterSeasons(
        winterYear,
        transaction,
      );

      // Recalculate derived Feature winter fee dates so Strapi flag changes
      // (e.g. a Feature's winter fee turned off) clear stale dates.
      for (const parkWinterSeasonId of parkWinterSeasonIds) {
        await propagateWinterFeeDates(parkWinterSeasonId, transaction);
      }

      // Parks with the flag off aren't propagated above, so clear their
      // Features' derived dates directly.
      const clearedCount = await clearWinterFeeDatesForUnflaggedParks(
        winterYear,
        transaction,
      );

      console.log(
        `Winter fee propagation for ${winterYear}: ${parkWinterSeasonIds.length} park seasons, ${clearedCount} stale dates cleared for unflagged parks`,
      );
    }

    // Ensure gate-detail records exist for newly imported entities.
    await createGateDetails(transaction);

    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.error("Transaction rolled back due to error:", err);
      } catch (rollbackError) {
        console.error("Failed to roll back transaction:", rollbackError);
      }
    }
    console.error("Scheduled jobs failed:", err);
    console.error(err.stack || err);
    throw err;
  }

  // Email reminders manage their own transactions internally.
  const { failedCount } = await queueEmailReminders();

  if (failedCount > 0) {
    throw new Error("Error processing email reminders: some reminders failed");
  }
}

export { runAllJobs };

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await runAllJobs();
}
