// import "../../env.js";

// import { Dateable, Park } from "../../models/index.js";
// import { fetchAllModels } from "../../strapi-sync/sync.js";
// import { getStrapiModelData } from "../../strapi-sync/utils.js";

// export async function createModel(model, data) {
//   if (data) {
//     return model.create(data);
//   }
//   return model.create();
// }


// export async function getItemByAttributes(model, attributes) {
//   try {
//     const item = await model.findOne({
//       where: attributes,
//     });

//     if (!item) {
//       return null;
//     }
//     return item;
//   } catch (error) {
//     console.error(
//       `Error fetching item by attributes: ${JSON.stringify(attributes)}`,
//       error,
//     );
//     throw error;
//   }
// }

// export async function createOrUpdatePark(item) {
//   // get park on our DB by strapi ID
//   let dbItem = await getItemByAttributes(Park, { strapiId: item.id });

//   if (dbItem) {
//     dbItem.name = item.attributes.protectedAreaName;
//     dbItem.managementAreas = item.mgmtAreaAndSection;
//     // Update it to false if inReservationSystem from Strapi returns null
//     dbItem.inReservationSystem =
//       item.parkOperation.inReservationSystem ?? false;

//     await dbItem.save();
//   } else {
//     const dateable = await createModel(Dateable);
//     const data = {
//       name: item.attributes.protectedAreaName,
//       orcs: item.attributes.orcs,
//       dateableId: dateable.id,
//       strapiId: item.id,
//       managementAreas: item.mgmtAreaAndSection,
//       inReservationSystem: item.parkOperation.inReservationSystem ?? false,
//     };

//     dbItem = await createModel(Park, data);
//   }

//   return dbItem;
// }


// export async function syncParks(parkData) {
//   const items = parkData.items;

//   await Promise.all(items.map((item) => createOrUpdatePark(item)));
// }


// export async function populateParks() {
//   const strapiData = await fetchAllModels();
//   const parkData = getStrapiModelData(strapiData, "protected-area");
//   const mgmtAreaData = getStrapiModelData(strapiData, "management-area");
//   const sectionData = getStrapiModelData(strapiData, "section");

//   // Add mgmt area and section data to parkData
//   parkData.items = parkData.items.map((park) => {
//     // Get management area and section data for the JSONB column
//     const mgmtAreaAndSection = park.attributes.managementAreas.data.map((m) => {
//       const mgmtAreaJson = mgmtAreaData.items.find(
//         (mgmtArea) => mgmtArea.id === m.id,
//       );

//       const sectionJson = sectionData.items.find(
//         (section) => section.id === mgmtAreaJson.section.id,
//       );

//       return {
//         mgmtArea: {
//           strapiId: mgmtAreaJson.id,
//           name: mgmtAreaJson.managementAreaName,
//           number: mgmtAreaJson.managementAreaNumber,
//         },
//         section: {
//           strapiId: sectionJson.id,
//           name: sectionJson.sectionName,
//           number: sectionJson.sectionNumber,
//         },
//       };
//     });

//     // Add parkOperation data to the parkData
//     const parkOperationLookup = Object.fromEntries(
//       parkOperationData.items.map((item) => [item.id, item]),
//     );
//     const parkOperationAttributes =
//       parkOperationLookup[park.attributes.parkOperation.data?.id] || {};
//     const parkOperation = parkOperationAttributes.attributes || {};
//     const { inReservationSystem } = parkOperation;

//     return {
//       ...park,
//       mgmtAreaAndSection,
//       parkOperation: {
//         inReservationSystem,
//       },
//     };
//   });

//   // const featureTypeData = getStrapiModelData(
//   //   strapiData,
//   //   "park-operation-sub-area-type",
//   // );
//   // const featureData = getStrapiModelData(strapiData, "park-operation-sub-area");

//   await syncParks(parkData);
//   // featureTypes need other strapi data to get the icon from campingType or facilityType
//   // await syncFeatureTypes(strapiData, featureTypeData);
//   // await syncFeatures(featureData);
//   await syncSections(sectionData);
//   await syncManagementAreas(mgmtAreaData);
// }
