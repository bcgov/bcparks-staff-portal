import "../../env.js";
import strapiApi from "../../utils/strapiApi.js";
import { ParkArea, Park } from "../../models/index.js";

function standardizeName(name) {
  let newName = name.trim().toLowerCase();

  newName = newName.replace(/groupsites/gu, "groupsite");
  newName = newName.replace(/group campground/gu, "groupsite");

  return newName;
}

export default async function updateOrcsAreaNumbers(transaction = null) {
  // Get all park area data from Strapi
  const strapiAreas = await strapiApi.getAllPages("/park-areas", {
    populate: {
      protectedArea: {
        fields: ["orcs"],
      },
    },
    fields: ["parkAreaName", "orcsAreaNumber"],
  });

  // Convert to an entities structure of key value pairs for lookups
  const strapiEntities = new Map(
    strapiAreas.map((area) => [
      `${area.protectedArea?.orcs}|${standardizeName(area.parkAreaName)}`,
      area.orcsAreaNumber,
    ]),
  );

  let updateCount = 0;

  try {
    // Fetch all parkArea records in the DOOT db
    const dootAreas = await ParkArea.findAll({
      attributes: ["id", "name", "strapiOrcsAreaNumber"],
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["orcs"],
        },
      ],
      transaction,
    });

    for (const area of dootAreas) {
      const key = `${area.park.orcs}|${standardizeName(area.name)}`;

      // Match on key to populate the strapiOrcsAreaNumber
      const orcsAreaNumber = strapiEntities.get(key);

      // Skip updating if there's no orcsAreaNumber from Strapi
      if (!orcsAreaNumber) continue;

      // Skip updating if the orcsAreaNumber hasn't changed
      if (area.strapiOrcsAreaNumber === orcsAreaNumber) continue;

      // Update and save the area record
      area.strapiOrcsAreaNumber = orcsAreaNumber;
      await area.save({ transaction });

      updateCount += 1;
    }
  } catch (error) {
    console.error("Failed to update strapiOrcsAreaNumber:", error);
    // Transaction rollback is handled by the caller.
    throw error;
  }

  console.log(`Updated ${updateCount} parkAreas with strapiOrcsAreaNumber.`);
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ParkArea.sequelize.transaction();

  try {
    await updateOrcsAreaNumbers(transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Failed to update strapiOrcsAreaNumber:", err);
    throw err;
  }
}
