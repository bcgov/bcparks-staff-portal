export async function createModel(model, data) {
  if (data) {
    return model.create(data);
  }
  return model.create();
}

export function getStrapiModelData(strapiData, modelName) {
  return strapiData.find((item) => item.model === modelName);
}

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

export async function getItemByAttributes(model, attributes) {
  try {
    const item = await model.findOne({
      where: attributes,
    });

    if (!item) {
      throw new Error(
        `Item with attributes ${JSON.stringify(attributes)} not found`,
      );
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
