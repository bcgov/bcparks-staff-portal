export async function createModel(model, data) {
  if (data) {
    return model.create(data);
  }
  return model.create();
}

export function getStrapiModelData(strapiData, modelName) {
  return strapiData.find((item) => item.model === modelName);
}

export function getStrapiModelDataById(strapiData, modelName, id) {
  const modelData = getStrapiModelData(strapiData, modelName);

  if (!modelData) {
    return null;
  }

  return modelData.items.find((item) => item.id === id);
}

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
