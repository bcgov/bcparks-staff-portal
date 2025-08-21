// This script populates ParkArea.inReservationSystem based on its child Features' inReservationSystem values.

import "../../env.js";
import { ParkArea, Feature } from "../../models/index.js";

export async function populateParkAreaInReservationSystem(transaction = null) {
  let updatedCount = 0;

  try {
    // find all ParkAreas with their Features
    const parkAreas = await ParkArea.findAll({
      include: [
        {
          model: Feature,
          as: "features",
          attributes: ["id", "inReservationSystem"],
        },
      ],
      transaction,
    });

    for (const parkArea of parkAreas) {
      const features = parkArea.features || [];

      if (features.length === 0) continue;

      const newValue = features.some(
        (feature) => feature.inReservationSystem === true,
      );

      if (parkArea.inReservationSystem !== newValue) {
        parkArea.inReservationSystem = newValue;
        await parkArea.save({ transaction });
        updatedCount++;

        console.log(
          `Updated ParkArea id=${parkArea.id} inReservationSystem=${newValue}`,
        );
      }
    }

    console.log(`Finished. Updated ${updatedCount} ParkAreas.`);
  } catch (error) {
    console.error("Error populating ParkArea.inReservationSystem:", error);
    throw error;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await ParkArea.sequelize.transaction();

  try {
    await populateParkAreaInReservationSystem(transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Error populating ParkArea.inReservationSystem:", err);
    throw err;
  }
}
