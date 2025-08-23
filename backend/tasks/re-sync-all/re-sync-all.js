import { exec } from "node:child_process";
import { promisify } from "node:util";

import { createDateRangeAnnualEntries } from "../create-date-range-annual/create-date-range-annual.js";
import { createDateTypes } from "../create-date-types/create-date-types.js";
import { createGateDetailsFromStrapi } from "../create-gate-details/create-gate-details.js";
import { deleteAllData } from "./delete-all.js";
import { importData } from "../../strapi-sync/reset-and-import-data.js";
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
  let step = 1;

  try {
    // 1 - delete all data but not User table
    console.log(`Starting: ${step} - Delete all data...`);
    await deleteAllData();
    console.log(`Finished: ${step} - Delete all data.\n`);
    step++;

    // 2 - import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi
    // TODO: split this "importData" out into a separate script in tasks
    console.log(
      `Starting: ${step} - Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi...`,
    );
    await importData();
    console.log(
      `Finished: ${step} - Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi.\n`,
    );
    step++;

    // 3 - import DateType from date-types.js
    console.log(`Starting: ${step} - Import DateType...`);
    await createDateTypes();
    console.log(`Finished: ${step} - Import DateType.\n`);
    step++;

    // 4 - populate "hasWinterFeeDates" in Park from 2025-winter-parks.json
    console.log(`Starting: ${step} - Populate hasWinterFeeDates in Park...`);
    await populateParkWinterFeeFlag();
    console.log(`Finished: ${step} - Populate hasWinterFeeDates in Park.\n`);
    step++;

    // 5 - populate "hasTier1Dates" and "hasTier2Dates" in Park from 2025-tier-data.json
    console.log(
      `Starting: ${step} - Populate hasTier1Dates and hasTier2Dates in Park...`,
    );
    await populateParkTierTypes();
    console.log(
      `Finished: ${step} - Populate hasTier1Dates and hasTier2Dates in Park.\n`,
    );
    step++;

    // 6 - populate "inReservationSystem" in ParkArea
    console.log(
      `Starting: ${step} - Populate inReservationSystem in ParkArea...`,
    );
    await populateParkAreaInReservationSystem();
    console.log(
      `Finished: ${step} - Populate inReservationSystem in ParkArea.\n`,
    );
    step++;

    // 7 - import AccessGroup, AccessGroupPark, UserAccessGroup from agreements-with-usernames.json
    console.log(
      `Starting: ${step} - Import AccessGroup, AccessGroupPark, UserAccessGroup...`,
    );
    await populateAccessGroups();
    console.log(
      `Finished: ${step} - Import AccessGroup, AccessGroupPark, UserAccessGroup.\n`,
    );
    step++;

    // 8 - create 2026 Seasons
    console.log(`Starting: ${step} - Create blank seasons for 2026...`);
    await execAsync("node ./tasks/create-seasons.js 2026");
    console.log(`Finished: ${step} - Create blank seasons for 2026.\n`);
    step++;

    // 9 - import Season and DateRange from Strapi park-operation-sub-area-dates
    console.log(`Starting: ${step} - Import sub-area dates...`);
    await importSubAreaDates();
    console.log(`Finished: ${step} - Import sub-area dates.\n`);
    step++;

    // 10 - import Season and DateRange from Strapi park-feature-dates
    console.log(`Starting: ${step} - Import park feature dates...`);
    await importParkFeatureDates();
    console.log(`Finished: ${step} - Import park feature dates.\n`);
    step++;

    // 11 - import Season and DateRange from Strapi park-operation-dates
    console.log(`Starting: ${step} - Import park gate dates...`);
    await populateParkGateDates();
    console.log(`Finished: ${step} - Import park gate dates.\n`);
    step++;

    // 12 - import Season and DateRange from previous-dates.json
    console.log(`Starting: ${step} - Import previous dates...`);
    await populatePreviousDates();
    console.log(`Finished: ${step} - Import previous dates.\n`);
    step++;

    // 13 - import DateRangeAnnual from Strapi park-operation
    console.log(`Starting: ${step} - Import DateRangeAnnual...`);
    await createDateRangeAnnualEntries();
    console.log(`Finished: ${step} - Import DateRangeAnnual.\n`);
    step++;

    // 14 - import GateDetail from Strapi park-operation and park-operation-sub-area
    console.log(`Starting: ${step} - Import GateDetail from Strapi...`);
    await createGateDetailsFromStrapi();
    console.log(`Finished: ${step} - Import GateDetail from Strapi.\n`);
    step++;

    console.log(`All re-sync ${step - 1} steps completed.`);
  } catch (err) {
    console.error("Error running scripts:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  reSyncAll();
}
