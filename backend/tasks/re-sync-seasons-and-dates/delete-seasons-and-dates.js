// This script deletes all Seasons and DateRanges from the database.

import "../../env.js";
import { Season, DateRange } from "../../models/index.js";

export async function deleteSeasonsAndDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // delete all DateRanges first (to avoid FK constraint errors)
    const dateRangeCount = await DateRange.destroy({ where: {}, transaction });
    // delete all Seasons
    const seasonCount = await Season.destroy({ where: {}, transaction });

    await transaction.commit();
    console.log(`Deleted ${seasonCount} Seasons and ${dateRangeCount} DateRanges.`);
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting Seasons and DateRanges:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  deleteSeasonsAndDates().catch((err) => {
    console.error("Failed to delete Seasons and DateRanges:", err);
    throw err;
  });
}
