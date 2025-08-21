import { exec } from "node:child_process";
import { promisify } from "node:util";

import { deleteAllData } from "./delete-all.js";
import { importSubAreaDates } from "../re-sync-seasons-and-dates/import-sub-area-dates.js";
import { importParkFeatureDates } from "../re-sync-seasons-and-dates/import-park-feature-dates.js";
import { populateParkGateDates } from "../populate-park-gate-dates/populate-park-gate-dates.js";
import { populatePreviousDates } from "../populate-previous-dates/populate-previous-dates.js";
import { populateParkWinterFeeFlag } from "../populate-park-winter-fee-flag/populate-park-winter-fee-flag.js";
import { createGateDetailsFromStrapi } from "../create-gate-details/create-gate-details.js";
import { createDateRangeAnnualEntries } from "../create-date-range-annual/create-date-range-annual.js";
import { populateAccessGroups } from "../populate-access-groups/populate-access-groups.js";
import { createDateTypes } from "../create-date-types/create-date-types.js";
import { populateParkTierTypes } from "../populate-park-tier-types/populate-park-tier-types.js";

const execAsync = promisify(exec);

// Re-sync these tables

// DateRange,
// DateRangeAnnual,
// DateType,
// Dateable,
// Feature,
// FeatureType,
// ManagementArea,
// Park,
// ParkArea,
// Publishable,
// Season,
// Section,

async function reSyncAll() {
  try {
    // 1 - delete all data but not User table
    console.log("Starting: Delete all data ...");
    await deleteAllData();
    console.log("Finished: Delete all data.\n");

    // importData()

    // 2 - (optional) create 2026 Seasons
    console.log("Starting: Create blank seasons for 2026...");
    await execAsync("node ./tasks/create-seasons.js 2026");
    console.log("Finished: Create blank seasons for 2026.\n");

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

    // 7 - populate park winter fee flag
    console.log("Starting: Populate park winter fee flag...");
    await populateParkWinterFeeFlag();
    console.log("Finished: Populate park winter fee flag.\n");

    // 8 - re-sync GateDetail
    console.log("Starting: Create GateDetails from Strapi...");
    await createGateDetailsFromStrapi();
    console.log("Finished: Create GateDetails from Strapi.\n");

    // 9 - create date range annual entries
    console.log("Starting: Create DateRange annual entries...");
    await createDateRangeAnnualEntries();
    console.log("Finished: Create DateRange annual entries.\n");

    // 10 - re-sync AccessGroup, AccessGroupPark, UserAccessGroup
    console.log("Starting: Populate Access Groups...");
    await populateAccessGroups();
    console.log("Finished: Populate Access Groups.\n");

    // 11 - create date types
    console.log("Starting: Create DateTypes...");
    await createDateTypes();
    console.log("Finished: Create DateTypes.\n");

    // 12 - populate park tier types
    console.log("Starting: Populate Park Tier Types...");
    await populateParkTierTypes();
    console.log("Finished: Populate Park Tier Types.\n");

    // TODO - reservation
    console.log("All re-sync season and date scripts completed.");
  } catch (err) {
    console.error("Error running scripts:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reSyncAll();
}
