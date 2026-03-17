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
