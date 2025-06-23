// This script creates or updates GateDetail entries for parks, park areas, and features
// and import data from Strap park-operation and park-operation-sub-area models.

import "../../env.js";

import { Park, ParkArea, Feature, GateDetail } from "../../models/index.js";
import { Op } from "sequelize";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

export async function createGateDetailsFromStrapi() {
  const transaction = await GateDetail.sequelize.transaction();

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
    const parkOpeationSubAreaById = {};

    for (const subArea of parkOperationSubAreaData.items) {
      parkOpeationSubAreaById[subArea.id] = subArea;
    }

    // 1 - get all parks with publishableId
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
    });

    // create or update gateDetail for each park
    for (const park of parks) {
      let gateDetail = await GateDetail.findOne({
        where: { parkId: park.id },
        transaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          { parkId: park.id },
          { transaction },
        );
      }

      // import Strapi park-operation data if orcs matches
      const parkOperation = parkOperationByOrcs[park.orcs];

      if (parkOperation) {
        gateDetail.hasGate =
          parkOperation.hasParkGate ?? gateDetail.hasGate;
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
        await gateDetail.save({ transaction });
      }
    }

    // 2 - get all parkAreas with publishableId
    const parkAreas = await ParkArea.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
    });

    for (const parkArea of parkAreas) {
      const gateDetail = await GateDetail.findOne({
        where: { parkAreaId: parkArea.id },
        transaction,
      });

      if (!gateDetail) {
        await GateDetail.create({ parkAreaId: parkArea.id }, { transaction });
      }
      // no Strapi import for parkArea
    }

    // 3 - get all features with publishableId
    const features = await Feature.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
      include: ["gateDetail"],
    });

    for (const feature of features) {
      let gateDetail = await GateDetail.findOne({
        where: { featureId: feature.id },
        transaction,
      });

      if (!gateDetail) {
        gateDetail = await GateDetail.create(
          { featureId: feature.id },
          { transaction },
        );
      }

      // import Strapi park-operation-sub-area data if strapiId matches
      const subArea = parkOpeationSubAreaById[feature.strapiId];

      if (subArea) {
        gateDetail.hasGate = subArea.hasGate ?? gateDetail.hasGate;
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
        await gateDetail.save({ transaction });
      }
    }

    await transaction.commit();
    console.log("GateDetail creation and import complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error creating GateDetail entries:", err);
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  createGateDetailsFromStrapi().catch((err) => {
    console.error("Failed to create gate details:", err);
    throw err;
  });
}
