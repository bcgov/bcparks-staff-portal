import { Op } from "sequelize";
import fs from "node:fs";
import path from "node:path";
import { Park } from "../../models/index.js";

export async function populateParkWinterFeeFlag() {
  // Load JSON data (originally from strapi-sync/park-winter-dates.json)
  const jsonPath = path.join(import.meta.dirname, "2025-winter-parks.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const orcsCodes = jsonData.map((park) => park.orcs);

  // Update each park
  // set hasWinterFeeDates true if orcs is in orcsCodes
  const [numUpdated] = await Park.update(
    { hasWinterFeeDates: true },
    {
      where: {
        orcs: {
          [Op.in]: orcsCodes,
        },
      },
    },
  );

  console.log(`Updated ${numUpdated} parks with winter fee dates`);

  return numUpdated;
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populateParkWinterFeeFlag().then(() => {
    console.log("Done");
  });
}
