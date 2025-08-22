import { exec } from "node:child_process";
import { promisify } from "node:util";

import { createDateRangeAnnualEntries } from "../create-date-range-annual/create-date-range-annual.js";
import { createDateTypes } from "../create-date-types/create-date-types.js";
import { createGateDetailsFromStrapi } from "../create-gate-details/create-gate-details.js";
import { deleteAllData } from "./delete-all.js";
import { importData } from "../../strapi-sync/import-data.js";
import { importParkFeatureDates } from "../re-sync-seasons-and-dates/import-park-feature-dates.js";
import { importSubAreaDates } from "../re-sync-seasons-and-dates/import-sub-area-dates.js";
import { populateAccessGroups } from "../populate-access-groups/populate-access-groups.js";
import { populateParkAreaInReservationSystem } from "../populate-in-reservation-system/populate-in-reservation-system.js";
import { populateParkGateDates } from "../populate-park-gate-dates/populate-park-gate-dates.js";
import { populateParkTierTypes } from "../populate-park-tier-types/populate-park-tier-types.js";
import { populateParkWinterFeeFlag } from "../populate-park-winter-fee-flag/populate-park-winter-fee-flag.js";
import { populatePreviousDates } from "../populate-previous-dates/populate-previous-dates.js";

const execAsync = promisify(exec);

async function reSyncAll() {
  try {
    // 1 - delete all data but not User table
    console.log("Starting: Delete all data ...");
    await deleteAllData();
    console.log("Finished: Delete all data.\n");

    // 2 - import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi
    // TODO: split this "importData" out into a separate script in tasks
    console.log(
      "Starting: Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi ...",
    );
    await importData();
    console.log(
      "Finished: Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi.\n",
    );

    // 3 - import DateType from date-types.js
    console.log("Starting: Import DateType...");
    await createDateTypes();
    console.log("Finished: Import DateType.\n");

    // 4 - populate hasWinterFeeDates in Park from 2025-winter-parks.json
    console.log("Starting: Populate hasWinterFeeDates in Park...");
    await populateParkWinterFeeFlag();
    console.log("Finished: Populate hasWinterFeeDates in Park.\n");

    // 5 - populate hasTier1Dates and hasTier2Dates in Park from 2025-tier-data.json
    console.log(
      "Starting: Populate hasTier1Dates and hasTier2Dates in Park...",
    );
    await populateParkTierTypes();
    console.log(
      "Finished: Populate hasTier1Dates and hasTier2Dates in Park.\n",
    );

    // 6 - populate inReservationSystem in ParkArea
    console.log("Starting: Populate inReservationSystem in ParkArea...");
    await populateParkAreaInReservationSystem();
    console.log("Finished: Populate inReservationSystem in ParkArea.\n");

    // 7 - import AccessGroup, AccessGroupPark, UserAccessGroup from agreements-with-usernames.json
    console.log(
      "Starting: Import AccessGroup, AccessGroupPark, UserAccessGroup...",
    );
    await populateAccessGroups();
    console.log(
      "Finished: Import AccessGroup, AccessGroupPark, UserAccessGroup.\n",
    );

    // 8 - import GateDetail from Strapi park-operation and park-operation-sub-area
    console.log("Starting: Import GateDetail from Strapi...");
    await createGateDetailsFromStrapi();
    console.log("Finished: Import GateDetail from Strapi.\n");

    // 9 - (optional) create 2026 Seasons
    console.log("Starting: Create blank seasons for 2026...");
    await execAsync("node ./tasks/create-seasons.js 2026");
    console.log("Finished: Create blank seasons for 2026.\n");

    // 10 - import Seasons and DateRanges from Strapi park-operation-sub-area-dates
    console.log("Starting: Import sub-area dates...");
    await importSubAreaDates();
    console.log("Finished: Import sub-area dates.\n");

    // 11 - import Season and DateRanges from Strapi park-feature-dates
    console.log("Starting: Import park feature dates...");
    await importParkFeatureDates();
    console.log("Finished: Import park feature dates.\n");

    // 12 - import Season and DateRanges from Strapi park-operation-dates
    console.log("Starting: Populate park gate dates...");
    await populateParkGateDates();
    console.log("Finished: Populate park gate dates.\n");

    // 13 - import Season and DateRanges from previous-dates.json
    console.log("Starting: Populate previous dates...");
    await populatePreviousDates();
    console.log("Finished: Populate previous dates.\n");

    // 14 - import DateRangeAnnual from Strapi park-operation
    console.log("Starting: Import DateRangeAnnual ...");
    await createDateRangeAnnualEntries();
    console.log("Finished: Import DateRangeAnnual.\n");

    console.log("All re-sync season and date scripts completed.");
  } catch (err) {
    console.error("Error running scripts:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reSyncAll();
}
