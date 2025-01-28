import axios from "axios";
import querystring from "node:querystring";

async function get(url) {
  try {
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error(error.message);
    return error;
  }
}

async function getPageData(url) {
  try {
    const response = await get(url);

    return response.data;
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

async function getData(url, queryParams) {
  try {
    let currentUrl = url;

    if (Object.keys(queryParams).length > 0) {
      currentUrl = `${url}?${querystring.stringify(queryParams)}`;
    }

    const data = await get(currentUrl);
    const pagination = data.meta.pagination;
    let items = data.data;

    let page = 2;

    while (page <= pagination.pageCount) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second

      const params = { ...queryParams, "pagination[page]": page };
      const paginatedUrl = `${url}?${querystring.stringify(params)}`;
      const pageData = await getPageData(paginatedUrl);

      items = items.concat(pageData);
      page++;
    }

    return items;
  } catch (error) {
    console.error(error.message);
    return [];
  }
}

async function fetchAllModels(apiUrl) {
  const strapiData = [
    {
      endpoint: "/park-operation-sub-areas",
      model: "park-operation-sub-area",
      fields: ["protectedArea", "parkSubAreaType", "parkOperationSubAreaDates"],
      items: [],
    },
    {
      endpoint: "/protected-areas",
      model: "protected-area",
      fields: ["parkFacilities", "parkOperations", "managementAreas"],
      items: [],
    },
    {
      endpoint: "/park-operation-sub-area-types",
      model: "park-operation-sub-area-type",
      fields: ["facilityType", "campingType"],
      items: [],
    },
    {
      endpoint: "/park-operation-sub-area-dates",
      model: "park-operation-sub-area-date",
      fields: ["protectedArea"],
      items: [],
    },
  ];

  for (const item of strapiData) {
    const currentUrl = apiUrl + item.endpoint;
    const params = {};

    for (const field of item.fields) {
      params[`populate[${field}][fields]`] = "id";
    }

    item.items = await getData(currentUrl, params);
  }

  return strapiData;
}

async function getDataForAllEnvs(envs) {
  return Promise.all(
    Object.values(envs).map(async (value) => {
      value.data = await fetchAllModels(value.apiUrl);
    }),
  );
}

function getModelData(data, modelName) {
  return data.find((item) => item.model === modelName);
}

function getModelDataById(data, modelName, uid) {
  try {
    const modelData = getModelData(data, modelName);

    return modelData.items.find((item) => item.id === uid);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

function getParkId(subarea) {
  // Helper method to get park id from subarea
  return subarea.attributes?.protectedArea?.data?.id || null;
}

function getParksWithSubareas(envs) {
  const result = {};

  for (const [envName, envData] of Object.entries(envs)) {
    result[envName] = {};

    const subareasData = getModelData(envData.data, "park-operation-sub-area");

    for (const item of subareasData.items) {
      const attrs = item.attributes;

      if (attrs) {
        if (attrs.isActive === false) {
          continue;
        }

        const parksData = attrs.protectedArea?.data || null;

        if (parksData) {
          const parkId = parksData.id;
          const park = getModelDataById(envData.data, "protected-area", parkId);

          if (park) {
            const orcs = park.attributes.orcs;

            if (!result[envName][orcs]) {
              result[envName][orcs] = {
                id: parkId,
                name: park.attributes.protectedAreaName,
                orcs: park.attributes.orcs,
                subareas: [],
              };
            }

            result[envName][orcs].subareas.push({
              id: item.id,
              name: attrs.parkSubArea,
              subareaTypeId: attrs.parkSubAreaType?.data?.id || null,
            });
          }
        }
      }
    }
  }

  return result;
}

function getNameDifferences(parksWithSubareas) {
  const prodData = parksWithSubareas.prod;
  const result = {};

  for (const [envName, envData] of Object.entries(parksWithSubareas)) {
    // Prod data is what we're trying to compare against - no need to compare it to itself
    if (envName === "prod") {
      continue;
    }

    result[envName] = {};

    for (const [orcs, park] of Object.entries(envData)) {
      const names = new Set(park.subareas.map((subarea) => subarea.name));
      const prodNames = new Set(
        (prodData[orcs]?.subareas || []).map((subarea) => subarea.name),
      );

      result[envName][orcs] = {
        id: park.id,
        orcs,
        name: park.name,
        missingInProd: [...names].filter((name) => !prodNames.has(name)),
        missingHere: [...prodNames].filter((name) => !names.has(name)),
        totalInProd: prodNames.size,
        totalHere: names.size,
      };
    }
  }

  return result;
}

function getSubareasNameMap(envs) {
  const output = {};
  const envNames = ["prod", "dev", "test", "alphaDev", "alphaTest"];

  for (const envName of envNames) {
    output[envName] = {};
    const envData = envs[envName]?.data;

    const subareas = getModelData(envData, "park-operation-sub-area");

    for (const subarea of subareas.items) {
      const parkId = getParkId(subarea);
      const park = getModelDataById(envData, "protected-area", parkId);

      if (!park) {
        continue;
      }

      const orcs = park.attributes.orcs;

      if (!output[envName][orcs]) {
        output[envName][orcs] = {};
      }

      output[envName][orcs][subarea.attributes.parkSubArea] = subarea.id;
    }
  }

  return output;
}

function getSubareaIdByName(subareasMap, envName, orcs, name) {
  return subareasMap[envName][orcs][name];
}

function getItemsToCreate(envNameDifferences, subareasMap) {
  /*
  Items that will be created in env: exist in prod but not here
  each park object will get a list `to_create` with a list of prod subarea IDs
  */
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    // nothing missing in prod from here
    // things missing here means they are new - we should create them in this env
    if (park.missingInProd.length === 0 && park.missingHere.length > 0) {
      park.toCreate = [];
      for (const prodSubAreaName of park.missingHere) {
        const prodSubareaId = getSubareaIdByName(
          subareasMap,
          "prod",
          orcs,
          prodSubAreaName,
        );

        park.toCreate.push(prodSubareaId);
      }
    }
  }
}

function getItemsToMarkInactive(envNameDifferences, subareasMap, envName) {
  /*
  Items that will be marked as inactive in dev
  each park object will get a list `to_mark_inactive` of env subarea IDs
  */
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    // nothing missing here from prod
    // things "missing" in prod means they are inactive or deleted - we should mark them as inactive here
    if (park.missingHere.length === 0 && park.missingInProd.length > 0) {
      park.toMarkInactive = [];
      for (const envSubareaName of park.missingInProd) {
        const envSubareaId = getSubareaIdByName(
          subareasMap,
          envName,
          orcs,
          envSubareaName,
        );

        park.toMarkInactive.push(envSubareaId);
      }
    }
  }
}

function getItemsToMatch(envNameDifferences, subareasMap, envName) {
  /*
  This method will append to the existing `to_create` and `to_mark_inactive`
  */
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    if (park.missingHere.length > 0 && park.missingInProd.length > 0) {
      if (!park.toCreate) {
        park.toCreate = [];
      }

      for (const prodSubareName of park.missingHere) {
        const prodSubareaId = getSubareaIdByName(
          subareasMap,
          "prod",
          orcs,
          prodSubareName,
        );

        park.toCreate.push(prodSubareaId);
      }

      if (!park.toMarkInactive) {
        park.toMarkInactive = [];
      }

      for (const envSubareaName of park.missingInProd) {
        const envSubareaId = getSubareaIdByName(
          subareasMap,
          envName,
          orcs,
          envSubareaName,
        );

        park.toMarkInactive.push(envSubareaId);
      }
    }
  }
}

function getSubareaTypeId(subarea) {
  /**
   * Helper method to get subarea_type_id from subarea
   */
  return subarea?.attributes?.parkSubAreaType?.data?.id || null;
}

function getEnvSubareaTypeByName(envs, envName, subareaTypeName) {
  /**
   * Returns sub_area_type object based on envName and subareaTypeName
   * Its ID will be used to create subarea in env
   */
  const envData = envs[envName]?.data;
  const subareaTypes = getModelData(
    envData,
    "park-operation-sub-area-type",
  )?.items;

  if (!subareaTypes) return null;

  return subareaTypes.find(
    (item) => item?.attributes?.subAreaType === subareaTypeName,
  );
}

function getEnvParKByOrcs(envs, envName, orcs) {
  const envData = envs[envName]?.data;
  const parks = getModelData(envData, "protected-area")?.items;

  return parks.find((park) => park.attributes.orcs === orcs) || null;
}

function getSubareaPayloadForEnv(envs, envName, temp) {
  const keysToRemove = new Set([
    "parkOperationSubAreaDates",
    "createdAt",
    "updatedAt",
    "publishedAt",
  ]);

  const sampleEnvSubarea = getModelData(
    envs[envName].data,
    "park-operation-sub-area",
  ).items[0];

  const envSubareaKeys = new Set(Object.keys(sampleEnvSubarea.attributes));

  const payload = {};

  for (const [key, value] of Object.entries(temp)) {
    if (envSubareaKeys.has(key) && !keysToRemove.has(key)) {
      payload[key] = value;
    }
  }

  return payload;
}

function getDatePayloadForEnv(envs, envName, temp) {
  const keysToRemove = new Set(["createdAt", "updatedAt", "publishedAt"]);

  const sampleEnvDate = getModelData(
    envs[envName].data,
    "park-operation-sub-area-date",
  ).items[0];

  const envDateKeys = new Set(Object.keys(sampleEnvDate.attributes));

  const payload = {};

  for (const [key, value] of Object.entries(temp)) {
    if (envDateKeys.has(key) && !keysToRemove.has(key)) {
      payload[key] = value;
    }
  }

  return payload;
}

function getEnvToken() {
  return process.env.STRAPI_TOKEN;
}

async function createSubareaInStrapi(envs, envName, subarea) {
  try {
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-areas/`;

    const strapiToken = getEnvToken();

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    const data = {
      data: subarea,
    };

    const response = await axios.post(fullUrl, data, { headers });

    return response.data.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function createDateInStrapi(envs, envName, date) {
  try {
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-area-dates/`;

    const strapiToken = getEnvToken(envName);

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    const data = {
      data: date,
    };

    const response = await axios.post(fullUrl, data, { headers });

    return response.data.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function createSubareaInEnv(envs, orcs, prodSubareaId, envName) {
  const prodData = envs.prod.data;

  const prodSubarea = getModelDataById(
    prodData,
    "park-operation-sub-area",
    prodSubareaId,
  );

  const obj = { ...prodSubarea.attributes };

  // get env subarea type ID to subarea
  const prodSubareaTypeId = getSubareaTypeId(prodSubarea);
  const prodSubareaType = getModelDataById(
    prodData,
    "park-operation-sub-area-type",
    prodSubareaTypeId,
  );
  const prodSubareaTypeName = prodSubareaType.attributes.subAreaType;

  const envSubareaType = getEnvSubareaTypeByName(
    envs,
    envName,
    prodSubareaTypeName,
  );
  const envSubareaTypeId = envSubareaType.id;

  obj.parkSubAreaType = envSubareaTypeId;

  // assign env park ID to subarea
  const envPark = getEnvParKByOrcs(envs, envName, orcs);
  const envParkId = envPark.id;

  obj.protectedArea = envParkId;

  const payload = getSubareaPayloadForEnv(envs, envName, obj);

  payload.globalId = `${orcs}_${prodSubareaId}`;

  const createdSubarea = await createSubareaInStrapi(envs, envName, payload);

  const datesData = prodSubarea?.attributes?.parkOperationSubAreaDates;

  if (!datesData) {
    return createdSubarea;
  }

  const dates = datesData?.data || [];

  createdSubarea.meta = {
    dates: [],
  };

  for (const date of dates) {
    const dateId = date.id;
    const prodDate = getModelDataById(
      prodData,
      "park-operation-sub-area-date",
      dateId,
    );

    if (!prodDate.attributes.isActive) {
      continue;
    }

    const tempDate = { ...prodDate.attributes };

    const datePayload = getDatePayloadForEnv(envs, envName, tempDate);

    datePayload.parkOperationSubArea = createdSubarea.id;

    const createdDate = await createDateInStrapi(envs, envName, datePayload);

    createdSubarea.meta.dates.push(createdDate);
  }

  return createdSubarea;
}

function getEnvNameDifferences(nameDifferences, envName) {
  return nameDifferences[envName];
}

async function getEnvDataToCreate(envs, nameDifferences, envName) {
  const envNameDifferences = getEnvNameDifferences(nameDifferences, envName);
  const result = [];

  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    if (park.toCreate) {
      for (const toCreateId of park.toCreate) {
        const response = createSubareaInEnv(envs, orcs, toCreateId, envName);

        result.push(response);
      }
    }
  }

  return result;
}

function removeKeysFromPayload(temp) {
  const keysToRemove = new Set([
    "createdAt",
    "updatedAt",
    "publishedAt",
    "protectedArea",
    "parkSubAreaType",
    "parkOperationSubAreaDates",
  ]);

  const output = {};

  for (const [key, value] of Object.entries(temp)) {
    if (!keysToRemove.has(key)) {
      output[key] = value;
    }
  }

  return output;
}

async function markSubareaInactive(envs, envName, subareaId) {
  try {
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-areas/${subareaId}`;

    const strapiToken = getEnvToken(envName);

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    const subarea = getModelDataById(
      envs[envName].data,
      "park-operation-sub-area",
      subareaId,
    );
    const attrs = { ...subarea.attributes };
    const payload = removeKeysFromPayload(attrs);

    payload.isActive = false;

    const data = {
      data: payload,
    };

    const response = await axios.put(fullUrl, data, { headers });

    return response.data.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function getEnvDataToMarkInactive(envs, nameDifferences, envName) {
  const envNameDifferences = getEnvNameDifferences(nameDifferences, envName);
  const result = [];

  for (const park of Object.values(envNameDifferences)) {
    if (park.toMarkInactive) {
      for (const toUpdateId of park.toMarkInactive) {
        const response = await markSubareaInactive(envs, envName, toUpdateId);

        result.push(response);
      }
    }
  }

  return result;
}

function getProdSubareaIdByOrcsAndName(prodSubareaMap, orcs, name) {
  return prodSubareaMap[orcs]?.[name] || null;
}

async function getEnvDataToUpdate(
  envs,
  parksWithSubareas,
  prodSubareaMap,
  envName,
) {
  const result = [];
  const envData = parksWithSubareas[envName];

  for (const [orcs, park] of Object.entries(envData)) {
    for (const subarea of park.subareas) {
      const prodSubareaId = getProdSubareaIdByOrcsAndName(
        prodSubareaMap,
        orcs,
        subarea.name,
      );

      if (prodSubareaId) {
        const envSubarea = getModelDataById(
          envs[envName].data,
          "park-operation-sub-area",
          subarea.id,
        );
        const attrs = { ...envSubarea.attributes };
        const payload = removeKeysFromPayload(attrs);

        payload.meta = {
          globalId: `${orcs}_${prodSubareaId}`,
          id: subarea.id,
        };

        result.push(payload);
      }
    }
  }
}

export async function run() {
  const envs = {
    prod: {
      apiUrl: "https://cms.bcparks.ca/api",
      data: null,
    },
    test: {
      apiUrl: "https://test-cms.bcparks.ca/api",
      data: null,
    },
    dev: {
      apiUrl: "https://dev-cms.bcparks.ca/api",
      data: null,
    },
    alphaTest: {
      apiUrl: "https://alpha-test-cms.bcparks.ca/api",
      data: null,
    },
    alphaDev: {
      apiUrl: "https://alpha-dev-cms.bcparks.ca/api",
      data: null,
    },
  };

  await getDataForAllEnvs(envs);

  // Get helper data structures
  // Lets you access list of subareas per park by using `env_name.orcs.subareas`
  const parksWithSubareas = getParksWithSubareas(envs);
  // lets you see the differences in subareas between prod and other envs
  const nameDifferences = getNameDifferences(parksWithSubareas);
  // lets you get a subarea ID by using `env_name.orcs.subarea_name`
  const subareasMap = getSubareasNameMap(envs);

  for (const [envName, envNameDifferences] of Object.entries(nameDifferences)) {
    getItemsToCreate(envNameDifferences, subareasMap);
    getItemsToMarkInactive(envNameDifferences, subareasMap, envName);
    getItemsToMatch(envNameDifferences, subareasMap, envName);
  }

  const envNames = ["dev", "test", "alphaDev", "alphaTest"];

  // lets you get a prod subarea ID by using `orcs.subarea_name`
  const prodSubareaMap = subareasMap.prod;

  for (const envName of envNames) {
    await getEnvDataToUpdate(envs, parksWithSubareas, prodSubareaMap, envName);
  }

  for (const envName of envNames) {
    await getEnvDataToCreate(envs, nameDifferences, envName);
  }

  for (const envName of envNames) {
    await getEnvDataToMarkInactive(envs, nameDifferences, envName);
  }
}
