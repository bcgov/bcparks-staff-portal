import { ParkArea, Park } from "../models/index.js";

/**
 * Creates model in our local DB
 * @param {Model} model Sequelize model
 * @param {Object} data Data to create model with
 * @returns {Promise<Model>} - Created model
 */
export async function createModel(model, data) {
  if (data) {
    return model.create(data);
  }
  return model.create();
}

/**
 * Gets the data for a specific model that we recently fetched from strapi
 * @param {Array} strapiData data for every model from strapi
 * @param {string} modelName the name of the model we want to retrieve from
 * @returns {Object} the data for the model we're looking for
 */
export function getStrapiModelData(strapiData, modelName) {
  return strapiData.find((item) => item.model === modelName);
}

/**
 * Gets the data for a specific model by id that we recently fetched from strapi
 * @param {Object} strapiData data for every model from strapi
 * @param {string} modelName the name of the model we want to retrieve from
 * @param {number} id the id of the model we want to retrieve
 * @returns {Object} the data for the specific model instance we're looking for
 */
export function getStrapiModelDataById(strapiData, modelName, id) {
  const modelData = getStrapiModelData(strapiData, modelName);

  if (!modelData) {
    return null;
  }

  return modelData.items.find((item) => item.id === id);
}

/**
 * Gets the icon for the feature type based on the camping type or facility type
 * @param {Array} strapiData data for every model from strapi
 * @param {Object} featureType the feature type we want to get the icon for
 * @returns {string} the icon for the feature type
 */
export function getFeatureTypeIcon(strapiData, featureType) {
  if (featureType.attributes.campingType.data !== null) {
    const campingType = getStrapiModelDataById(
      strapiData,
      "camping-type",
      featureType.attributes.campingType.data.id,
    );

    return campingType?.attributes.icon;
  }
  const facilityType = getStrapiModelDataById(
    strapiData,
    "facility-type",
    featureType.attributes.facilityType.data.id,
  );

  return facilityType?.attributes.icon;
}

/**
 * Gets an items from the local DB by id
 * @param {Object} model Sequelize model
 * @param {number} id id of the item to get from DB
 * @returns {Promise<Model>} - Item with the given id
 */
export async function getItemById(model, id) {
  try {
    const item = await model.findByPk(id);

    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  } catch (error) {
    console.error(`Error fetching item by id: ${id}`, error);
    throw error;
  }
}

/**
 * Gets an item from the local DB by attributes
 * @param {Object} model Sequelize model
 * @param {Object} attributes attributes to search for (key-value pairs)
 * @returns {Promise<Model>} - Item with the given attributes
 */
export async function getItemByAttributes(model, attributes) {
  try {
    const item = await model.findOne({
      where: attributes,
    });

    if (!item) {
      return null;
    }
    return item;
  } catch (error) {
    console.error(
      `Error fetching item by attributes: ${JSON.stringify(attributes)}`,
      error,
    );
    throw error;
  }
}

/**
 * Finds or creates a ParkArea for a given parkArea item
 * @param {Object} item parkArea item from JSON data
 * @returns {Promise<Model>} A found or newly created ParkArea
 */
export async function findOrCreateParkArea(item) {
  // get park by orcs
  const park = await getItemByAttributes(Park, {
    orcs: String(item.orcs),
  });

  if (!park) {
    throw new Error(`Park with ORCS ${item.orcs} not found`);
  }

  // check if ParkArea with the same name and parkId already exists
  let parkArea = await ParkArea.findOne({
    where: {
      name: item.campgroundName,
      parkId: park.id,
    },
  });

  // if it doesn't exist, create it
  if (!parkArea) {
    const data = {
      name: item.campgroundName,
      parkId: park.id,
    };

    parkArea = await createModel(ParkArea, data);
  }

  return parkArea;
}
