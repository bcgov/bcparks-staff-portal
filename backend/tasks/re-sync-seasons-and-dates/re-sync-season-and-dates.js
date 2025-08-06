import { promisify } from "node:util";
import { exec } from "node:child_process";

import { deleteSeasonsAndDates } from "./delete-seasons-and-dates.js";
import { importSubAreaDates } from "./import-sub-area-dates.js";
import { importParkFeatureDates } from "./import-park-feature-dates.js";
import { populateParkGateDates } from "../populate-park-gate-dates/populate-park-gate-dates.js";
import { populatePreviousDates } from "../populate-previous-dates/populate-previous-dates.js";

const execAsync = promisify(exec);

async function reSyncSeasonsAndDates() {
  try {
    // 1 - delete all Seasons, SeasonChangeLogs, DateRanges
    console.log(
      "Starting: Delete all Seasons, SeasonChangeLogs, and DateRanges...",
    );
    await deleteSeasonsAndDates();
    console.log(
      "Finished: Delete all Seasons, SeasonChangeLogs, and DateRanges.\n",
    );

    // 2 - create 2025 and 2026 seasons
    console.log("Starting: Create blank seasons for 2025...");
    await execAsync("node ./tasks/create-seasons.js 2025");
    console.log("Finished: Create blank seasons for 2025.\n");

    // 3 - import sub-area dates from Strapi, and populate Seasons and DateRanges
    console.log("Starting: Import sub-area dates...");
    await importSubAreaDates();
    console.log("Finished: Import sub-area dates.\n");

    // 4 - import park feature dates from Strapi, and populate Seasons and DateRanges
    console.log("Starting: Import park feature dates...");
    await importParkFeatureDates();
    console.log("Finished: Import park feature dates.\n");

    // 5 - import park operating dates (gate dates) from Strapi, and populate Seasons and DateRanges
    console.log("Starting: Populate park gate dates...");
    await populateParkGateDates();
    console.log("Finished: Populate park gate dates.\n");

    // 6 - import previous dates from JSON, and populate Seasons and DateRanges
    console.log("Starting: Populate previous dates...");
    await populatePreviousDates();
    console.log("Finished: Populate previous dates.\n");

    console.log("All re-sync season and date scripts completed.");
  } catch (err) {
    console.error("Error running scripts:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reSyncSeasonsAndDates();
}
