// For Winter fee dates collected at the Park level,
// This script will propagate the dates down to the Frontcountry camping Feature and Area levels.

import { Season, Park } from "../models/index.js";

export async function propagateWinterFeeDates(seasonId, transaction = null) {
  // Get the current Season, along with its Park details
  const season = await Season.findByPk(seasonId, {
    include: [
      {
        model: Park,
        as: "park",
        // attributes: ["id", "name"],
      },
    ],
    transaction,
  });

  console.log("season:");
  console.log(season.toJSON());
}

// run it for testing
try {
  await propagateWinterFeeDates(19533); // Park season
  // await propagateWinterFeeDates(19534); // Area season
  // await propagateWinterFeeDates(19535); // Area feature season
  // await propagateWinterFeeDates(19536); // Feature season
} catch (error) {
  console.error("Error propagating winter fee dates:", error);
} finally {
  console.log("Winter fee dates propagation completed.");
}
