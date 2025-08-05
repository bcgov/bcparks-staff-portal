import { deleteSeasonsAndDates } from "./delete-seasons-and-dates.js";
import { importSubAreaDates } from "./import-sub-area-dates.js";
import { importParkFeatureDates } from "./import-park-feature-dates.js";

async function reSyncSeasonsAndDates() {
  try {
    console.log("Starting: Delete all Seasons and DateRanges...");
    await deleteSeasonsAndDates();
    console.log("Finished: Delete all Seasons and DateRanges.\n");

    console.log("Starting: Import sub-area dates...");
    await importSubAreaDates();
    console.log("Finished: Import sub-area dates.\n");

    console.log("Starting: Import park feature dates...");
    await importParkFeatureDates();
    console.log("Finished: Import park feature dates.\n");

    console.log("All re-sync season and date scripts completed.");
  } catch (err) {
    console.error("Error running scripts:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reSyncSeasonsAndDates();
}
