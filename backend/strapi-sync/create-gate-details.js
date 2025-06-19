import {
  getItemByAttributes,
  createModel,
  getStrapiModelData,
} from "./utils.js";
import { Park, ParkArea, Feature, GateDetail } from "../models/index.js";
import { fetchAllModels } from "./sync.js";
// import GateDetailModel from "./gatedetail.js";

// const GateDetail = GateDetailModel(sequelize)
// const models = {
//   Park,
//   ParkArea,
//   Feature,
//   GateDetail,
// };

/**
 * For the park-operation/park-operation-sub-area in Strapi,
 * create a new gate detail or update its corresponding existing gate detail
 * @param {Object} item park-operation/park-operation-sub-area data from Strapi
 * @returns {GateDetail} gate detail model
 */
export async function createOrUpdateGateDetail(item) {
  let dbItem = await getItemByAttributes(GateDetail, { id: item.id });

  console.log("DB ITEM:", dbItem);
  console.log("ITEM:", item);

  if (dbItem) {
    // update existing gate detail
    if (item.parkId) dbItem.parkId = item.parkId;
    if (item.parkAreaId) dbItem.parkAreaId = item.parkAreaId;
    if (item.featureId) dbItem.featureId = item.featureId;
    dbItem.hasGate = item.hasGate;
    dbItem.gateOpenTime = item.gateOpenTime;
    dbItem.gateCloseTime = item.gateCloseTime;
    dbItem.gateOpensAtDawn = item.gateOpensAtDawn;
    dbItem.gateClosesAtDusk = item.gateClosesAtDusk;
    dbItem.gateOpen24Hours = item.gateOpen24Hours;
    dbItem.isTimeRangeAnnual = item.isTimeRangeAnnual;
    await dbItem.save();
  } else {
    // create a new gate detail
    const data = {
      id: item.id,
      parkId: item.parkId || null,
      parkAreaId: item.parkAreaId || null,
      featureId: item.featureId || null,
      hasGate: item.hasGate || false,
      gateOpenTime: item.gateOpenTime || null,
      gateCloseTime: item.gateCloseTime || null,
      gateOpensAtDawn: item.gateOpensAtDawn || false,
      gateClosesAtDusk: item.gateClosesAtDusk || false,
      gateOpen24Hours: item.gateOpen24Hours || false,
      isTimeRangeAnnual: item.isTimeRangeAnnual || false,
    };

    dbItem = await createModel(GateDetail, data);
  }

  return dbItem;
}

/**
 * Sync park-operation/park-operation-sub-area from Strapi to our database
 * @param {Object} gateDetailData  park-operation/park-operation-sub-area data
 * from Strapi with items to sync
 * @returns {Promise[Object]} resolves when all gate details have been synced
 */
export async function syncGateDetails(gateDetailData) {
  const items = gateDetailData.items;

  await Promise.all(items.map((item) => createOrUpdateGateDetail(item)));
}

/**
 * Syncs data from Strapi to our database
 * Focuses on gate details for parks, park areas, and features
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncAllGateDetails() {
  const strapiData = await fetchAllModels();

  const parkOperationData = getStrapiModelData(strapiData, "park-operation");
  const parkOperationSubArea = getStrapiModelData(
    strapiData,
    "park-operation-sub-area",
  );
}

// /**
//  * Imports gate details from Strapi to GateDetail model
//  * @param {Array} items - Array of Strapi park-operation or park-operation-sub-area items
//  * @param {string} level - "park", "parkArea", or "feature"
//  */
// async function importGateDetails(items, level) {
//   for (const item of items) {
//     // Extract gate fields from Strapi attributes (adjust field names as needed)
//     const attrs = item.attributes || {};
//     const gateData = {
//       hasParkGate: attrs.hasParkGate ?? false,
//       gateOpenTime: attrs.gateOpenTime ?? null,
//       gateCloseTime: attrs.gateCloseTime ?? null,
//       gateOpensAtDawn: attrs.gateOpensAtDawn ?? false,
//       gateClosesAtDusk: attrs.gateClosesAtDusk ?? false,
//       gateOpen24Hours: attrs.gateOpen24Hours ?? false,
//     };

//     // Find the related model instance
//     let parent = null;
//     if (level === "park") {
//       parent = await getItemByAttributes(Park, { strapiId: item.id });
//       if (parent) gateData.parkId = parent.id;
//     } else if (level === "parkArea") {
//       parent = await getItemByAttributes(ParkArea, { strapiId: item.id });
//       if (parent) gateData.parkAreaId = parent.id;
//     } else if (level === "feature") {
//       parent = await getItemByAttributes(Feature, { strapiId: item.id });
//       if (parent) gateData.featureId = parent.id;
//     }

//     if (parent) {
//       // Check if GateDetail already exists for this parent
//       let gateDetail = await getItemByAttributes(GateDetail, gateData);
//       if (!gateDetail) {
//         await createModel(GateDetail, gateData);
//         console.log(`Created GateDetail for ${level} id=${parent.id}`);
//       } else {
//         // Optionally update existing GateDetail here
//         console.log(`GateDetail already exists for ${level} id=${parent.id}`);
//       }
//     }
//   }
// }
