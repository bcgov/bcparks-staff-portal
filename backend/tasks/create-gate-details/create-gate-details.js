// This script creates or updates GateDetail entries for parks, park areas, and features
// and import data from Strapi park-operation and park-operation-sub-area models.

import "../../env.js";

import { Park, ParkArea, Feature, GateDetail } from "../../models/index.js";
import { Op } from "sequelize";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

export async function createGateDetailsFromStrapi(transaction = null) {
  let localTransaction = transaction;
  let createdTransaction = false;

  if (!localTransaction) {
    localTransaction = await GateDetail.sequelize.transaction();
    createdTransaction = true;
  }

  try {
    // fetch all models from Strapi
    const strapiData = await fetchAllModels();
    // get park-operation and park-operation-sub-area data from Strapi
    const parkOperationData = getStrapiModelData(strapiData, "park-operation");
    const parkOperationSubAreaData = getStrapiModelData(
      strapiData,
      "park-operation-sub-area",
    );

    // build lookup for park-operation by orcs
    const parkOperationByOrcs = {};

    for (const parkOperation of parkOperationData.items) {
      const orcs =
        parkOperation.attributes?.protectedArea?.data?.attributes?.orcs;

      if (orcs) parkOperationByOrcs[orcs] = parkOperation.attributes;
    }

    // build lookup for park-operation-sub-area by id
    const parkOperationSubAreaById = {};

    for (const subArea of parkOperationSubAreaData.items) {
      parkOperationSubAreaById[subArea.id] = subArea;
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
        gateDetail.hasGate = parkOperation.hasParkGate;
        gateDetail.gateOpenTime =
          parkOperation.gateOpenTime ?? gateDetail.gateOpenTime;
        gateDetail.gateCloseTime =
          parkOperation.gateCloseTime ?? gateDetail.gateCloseTime;
        gateDetail.gateOpensAtDawn =
          parkOperation.gateOpensAtDawn ?? gateDetail.gateOpensAtDawn;
        gateDetail.gateClosesAtDusk =
          parkOperation.gateClosesAtDusk ?? gateDetail.gateClosesAtDusk;
        gateDetail.gateOpen24Hours =
          parkOperation.gateOpen24Hours ?? gateDetail.gateOpen24Hours;
        await gateDetail.save({ transaction: localTransaction });
      }
    }

    // 2 - get all parkAreas with publishableId
    const parkAreas = await ParkArea.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction: localTransaction,
    });

    for (const parkArea of parkAreas) {
      const gateDetail = await GateDetail.findOne({
        where: { publishableId: parkArea.publishableId },
        transaction: localTransaction,
      });

      if (!gateDetail) {
        await GateDetail.create(
          { publishableId: parkArea.publishableId },
          { transaction: localTransaction },
        );
      }
      // no Strapi import for parkArea
    }

    // 3 - get all features with publishableId
    const features = await Feature.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction: localTransaction,
    });

    for (const feature of features) {
      let gateDetail = await GateDetail.findOne({
        where: { publishableId: feature.publishableId },
        transaction: localTransaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          { publishableId: feature.publishableId },
          { transaction: localTransaction },
        );
      }

      // import Strapi park-operation-sub-area data if strapiId matches
      const subArea = parkOperationSubAreaById[feature.strapiId];

      if (subArea) {
        gateDetail.hasGate = subArea.hasGate;
        gateDetail.gateOpenTime =
          subArea.gateOpenTime ?? gateDetail.gateOpenTime;
        gateDetail.gateCloseTime =
          subArea.gateCloseTime ?? gateDetail.gateCloseTime;
        gateDetail.gateOpensAtDawn =
          subArea.gateOpensAtDawn ?? gateDetail.gateOpensAtDawn;
        gateDetail.gateClosesAtDusk =
          subArea.gateClosesAtDusk ?? gateDetail.gateClosesAtDusk;
        gateDetail.gateOpen24Hours =
          subArea.gateOpen24Hours ?? gateDetail.gateOpen24Hours;
        await gateDetail.save({ transaction: localTransaction });
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
