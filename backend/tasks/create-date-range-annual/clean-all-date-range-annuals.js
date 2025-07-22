// This script deletes all DateRangeAnnual records from the database.

import "../../env.js";

import { DateRangeAnnual } from "../../models/index.js";

export async function cleanAllDateRangeAnnuals() {
  try {
    await DateRangeAnnual.destroy({ where: {}, truncate: true });
    console.log("All DateRangeAnnual records deleted.");
  } catch (err) {
    console.error("Error deleting DateRangeAnnual records:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  cleanAllDateRangeAnnuals().catch((err) => {
    console.error("Unhandled error in cleanAllDateRangeAnnuals:", err);
    throw err;
  });
}
