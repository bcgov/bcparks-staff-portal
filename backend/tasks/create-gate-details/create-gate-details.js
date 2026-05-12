// This script creates GateDetail entries for parks, park areas, and features

import "../../env.js";

import { Park, ParkArea, Feature, GateDetail } from "../../models/index.js";
import { Op } from "sequelize";

export default async function createGateDetails(transaction = null) {
  console.log(`\nSTARTING CREATE-GATE-DETAILS\n`);

  let createdCount = 0;

  try {
    // 1 - get all parks with publishableId
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null }, hasDates: true },
      transaction,
    });

    // create or update gateDetail for each park
    for (const park of parks) {
      let gateDetail = await GateDetail.findOne({
        where: { publishableId: park.publishableId },
        transaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          { publishableId: park.publishableId },
          { transaction },
        );
        createdCount++;
      }
    }

    // 2 - get all features
    const features = await Feature.findAll({
      where: { active: true, hasDates: true },
      include: [
        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id", "name", "publishableId"],
          required: false,
        },
      ],
      transaction,
    });

    for (const feature of features) {
      // use parkArea's publishableId if feature belongs to a parkArea
      // otherwise use feature's publishableId
      const targetPublishableId =
        feature.parkArea?.publishableId || feature.publishableId;

      if (!targetPublishableId) continue;

      let gateDetail = await GateDetail.findOne({
        where: {
          publishableId: targetPublishableId,
        },
        transaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          {
            publishableId: targetPublishableId,
          },
          { transaction },
        );
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`Created ${createdCount} GateDetail entries`);
    } else {
      console.log(`No new GateDetail entries needed to be created`);
    }

    console.log("GateDetail creation complete");
  } catch (err) {
    console.error("Error creating GateDetail entries:", err);
    throw err;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // Run all queries in a transaction
  const transaction = await GateDetail.sequelize.transaction();

  try {
    await createGateDetails(transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
