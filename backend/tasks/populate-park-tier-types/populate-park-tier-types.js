import fs from "node:fs";
import path from "node:path";
import { Park } from "../../models/index.js";

export async function populateParkTierTypes() {
  // Load JSON data
  const jsonPath = path.join(import.meta.dirname, "2025-tier-data.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Update each park
  const updateQueries = jsonData.map(async (parkData) => {
    const { orcs, tierType } = parkData;
    const columnName = tierType === "t1" ? "hasTier1Dates" : "hasTier2Dates";

    try {
      const park = await Park.findOne({ where: { orcs } });

      if (!park) {
        throw new Error(`Park with orcs ${orcs} not found.`);
      }

      // Update the park with the appropriate tier type
      const updateQuery = await park.update({
        [columnName]: true,
      });

      console.log(`Updated park ${orcs} with tierType ${tierType}`);

      return updateQuery;
    } catch (error) {
      console.error(`Error updating park ${orcs}:`, error);
    }

    return null;
  });

  await Promise.all(updateQueries);
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populateParkTierTypes().then(() => {
    console.log("Done");
  });
}
