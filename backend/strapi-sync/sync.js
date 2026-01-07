import "../env.js";
import { getItemByAttributes, createModel } from "./utils.js";
import { Park, Section, ManagementArea } from "../models/index.js";
import { getStrapiModelData } from "./strapi-data-service.js";
import importStrapiParkAreas from "../tasks/import-park-areas/import-park-areas.js";
import importStrapiFeatureTypes from "../tasks/import-feature-types/import-feature-types.js";
import importStrapiFeatures from "../tasks/import-features/import-features.js";
import importStrapiProtectedAreas from "../tasks/import-parks/import-parks.js";
import importStrapiDateTypes from "../tasks/import-date-types/import-date-types.js";

/**
 * For the section in Strapi, create a new section or update its corresponding existing section
 * @param {Object} item section data from Strapi
 * @returns {Section} section model
 */
export async function createOrUpdateSection(item) {
  let dbItem = await getItemByAttributes(Section, { id: item.id });

  if (dbItem) {
    // update existing section
    dbItem.sectionNumber = item.sectionNumber;
    dbItem.name = item.sectionName;
    await dbItem.save();
  } else {
    // create a new section
    const data = {
      id: item.id,
      sectionNumber: item.sectionNumber,
      name: item.sectionName,
    };

    dbItem = await createModel(Section, data);
  }

  return dbItem;
}

/**
 * Sync sections from Strapi to our database
 * @param {Object} sectionData section data from Strapi with items to sync
 * @returns {Promise[Object]} resolves when all sections have been synced
 */
export async function syncSections(sectionData) {
  const items = sectionData.items;

  await Promise.all(items.map((item) => createOrUpdateSection(item)));
}

/**
 * For the management area in Strapi, create a new management area or update its corresponding existing management area
 * @param {Object} item management area data from Strapi
 * @returns {ManagementArea} management area model
 */
export async function createOrUpdateManagementArea(item) {
  let dbItem = await getItemByAttributes(ManagementArea, { id: item.id });

  if (dbItem) {
    // update existing management area
    dbItem.managementAreaNumber = item.managementAreaNumber;
    dbItem.name = item.managementAreaName;
    dbItem.sectionId = item.section?.id;

    await dbItem.save();
  } else {
    // Create a new management area
    const data = {
      id: item.id,
      managementAreaNumber: item.managementAreaNumber,
      name: item.managementAreaName,
      sectionId: item.section?.id,
    };

    dbItem = await createModel(ManagementArea, data);
  }

  return dbItem;
}

/**
 * Sync management areas from Strapi to our database
 * @param {Object} managementAreaData management area data from Strapi with items to sync
 * @returns {Promise[Object]} resolves when all management areas have been synced
 */
export async function syncManagementAreas(managementAreaData) {
  const items = managementAreaData.items;

  await Promise.all(items.map((item) => createOrUpdateManagementArea(item)));
}

/**
 * Syncs data from Strapi to our database
 * Focuses on parks, featureTypes, and features
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncData() {
  const mgmtAreaData = await getStrapiModelData("management-area");
  const sectionData = await getStrapiModelData("section");

  await syncSections(sectionData);
  await syncManagementAreas(mgmtAreaData);

  const transaction = await Park.sequelize.transaction();

  await importStrapiDateTypes(transaction);
  await importStrapiProtectedAreas(transaction);
  await importStrapiParkAreas(transaction);
  await importStrapiFeatureTypes(transaction);
  await importStrapiFeatures(transaction);

  await transaction.commit();
}
