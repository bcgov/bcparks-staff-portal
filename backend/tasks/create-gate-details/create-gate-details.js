// This script creates or updates GateDetail entries for parks, park areas, and features
// and import data from Strapi park-operation and park-operation-sub-area models.

import "../../env.js";

import { Park, ParkArea, Feature, GateDetail } from "../../models/index.js";
import { Op } from "sequelize";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

async function updateGateDetailFromStrapi(gateDetail, strapiData, transaction) {
  // park-operation uses "hasParkGate"
  // park-operation-sub-area uses "hasGate"
  gateDetail.hasGate = strapiData.hasGate ?? strapiData.hasParkGate;
  gateDetail.gateOpenTime = strapiData.gateOpenTime ?? gateDetail.gateOpenTime;
  gateDetail.gateCloseTime =
    strapiData.gateCloseTime ?? gateDetail.gateCloseTime;
  gateDetail.gateOpensAtDawn =
    strapiData.gateOpensAtDawn ?? gateDetail.gateOpensAtDawn;
  gateDetail.gateClosesAtDusk =
    strapiData.gateClosesAtDusk ?? gateDetail.gateClosesAtDusk;
  gateDetail.gateOpen24Hours =
    strapiData.gateOpen24Hours ?? gateDetail.gateOpen24Hours;

  await gateDetail.save({ transaction });
}

export async function createGateDetailsFromStrapi(transaction = null) {
  let localTransaction = transaction;
  let createdTransaction = false;

  if (!localTransaction) {
    localTransaction = await GateDetail.sequelize.transaction();
    createdTransaction = true;
  }

  try {
    // get park-operation and park-operation-sub-area data from Strapi
    const parkOperationData = await getStrapiModelData("park-operation");
    const parkOperationSubAreaData = await getStrapiModelData(
      "park-operation-sub-area",
    );

    // build lookup for park-operation by orcs
    const parkOperationByOrcs = {};

    for (const parkOperation of parkOperationData.items) {
      const orcs = parkOperation?.protectedArea?.orcs;

      if (orcs) parkOperationByOrcs[orcs] = parkOperation;
    }

    // build lookup for park-operation-sub-area by name (parkSubArea)
    const parkOperationSubAreaByName = {};
    // build lookup for park-operation-sub-area by id
    const parkOperationSubAreaById = {};

    for (const subArea of parkOperationSubAreaData.items) {
      // index by name
      if (subArea.parkSubArea) {
        parkOperationSubAreaByName[subArea.parkSubArea] = subArea;
      }
      // index by id
      if (subArea.id) {
        parkOperationSubAreaById[subArea.id] = subArea;
      }
    }

    // 1 - get all parks with publishableId
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction: localTransaction,
    });

    // create or update gateDetail for each park
    for (const park of parks) {
      let gateDetail = await GateDetail.findOne({
        where: { publishableId: park.publishableId },
        transaction: localTransaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          { publishableId: park.publishableId },
          { transaction: localTransaction },
        );
      }

      // import Strapi park-operation data if orcs matches
      const parkOperation = parkOperationByOrcs[park.orcs];

      if (parkOperation) {
        await updateGateDetailFromStrapi(
          gateDetail,
          parkOperation,
          localTransaction,
        );
      }
    }

    // 2 - get all features
    const features = await Feature.findAll({
      include: [
        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id", "name", "publishableId"],
          required: false,
        },
      ],
      transaction: localTransaction,
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
        transaction: localTransaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          {
            publishableId: targetPublishableId,
          },
          { transaction: localTransaction },
        );
      }

      // import Strapi park-operation-sub-area data if area/feature name or strapiId matches
      const subArea =
        parkOperationSubAreaByName[feature.parkArea?.name] ||
        parkOperationSubAreaByName[feature.name] ||
        parkOperationSubAreaById[feature.strapiId];

      if (subArea) {
        await updateGateDetailFromStrapi(gateDetail, subArea, localTransaction);
      }
    }

    if (createdTransaction) {
      await localTransaction.commit();
    }
    console.log("GateDetail creation and import complete.");
  } catch (err) {
    if (createdTransaction && localTransaction) {
      await localTransaction.rollback();
    }
    console.error("Error creating GateDetail entries:", err);
    throw err;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    try {
      await createGateDetailsFromStrapi();
    } catch (err) {
      console.error("Failed to create GateDetails:", err);
      throw err;
    }
  })();
}
