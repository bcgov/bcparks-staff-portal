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
  // We need parks, subareas, subarea types, and dates for each env
  // These are all used for comparing subareas between envs and help with creating/updating subareas
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
  // Will fetch the data for env and assign it to the env object's data property
  return Promise.all(
    Object.values(envs).map(async (value) => {
      value.data = await fetchAllModels(value.apiUrl);
    }),
  );
}

function getModelData(data, modelName) {
  // within a given env, find all data related to a model
  return data.find((item) => item.model === modelName);
}

function getModelDataById(data, modelName, uid) {
  // within a given env, find a specific object by its ID and model name
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
  // just to make the code more readable in other places
  return subarea.attributes?.protectedArea?.data?.id || null;
}

function getParksWithSubareas(envs) {
  /*
   *  Returns a structure like: It helps to see which subareas belong to which park across envs
   * {
   *    envName: {
   *      orcs: {
   *        id: parkId,
   *        name: parkName,
   *        orcs: orcs,
   *        subareas: [ { id, name, subareaTypeId } ]
   *      }
   *    }
   * }
   */
  const result = {};

  // Loop through all envs
  // For each env, it will assign subareas to the park they belong to
  for (const [envName, envData] of Object.entries(envs)) {
    result[envName] = {};

    // subareas for this env
    const subareasData = getModelData(envData.data, "park-operation-sub-area");

    for (const item of subareasData.items) {
      const attrs = item.attributes;

      if (attrs) {
        // inactive subareas can be skipped
        if (attrs.isActive === false) {
          continue;
        }

        // park for this subarea
        const parkData = attrs.protectedArea?.data || null;

        if (parkData) {
          const parkId = parkData.id;
          const park = getModelDataById(envData.data, "protected-area", parkId);

          if (park) {
            const orcs = park.attributes.orcs;

            // use orcs to build map of parks with subareas
            // orcs is consistent across envs for parks, it can be used for comparison
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
  // This method will compare subareas between envs and prod for each park
  // It will return a structure like:
  // {
  //   envName: {
  //     orcs: {
  //       id: parkId,
  //       orcs: orcs,
  //       name: parkName,
  //       missingInProd: [subareaName],
  //       missingHere: [subareaName],
  //       totalInProd: totalSubareasInProd,
  //       totalHere: totalSubareasHere
  //     }
  // }
  const prodParksWithSubareas = parksWithSubareas.prod;
  const result = {};

  for (const [envName, envData] of Object.entries(parksWithSubareas)) {
    // Prod data is what we're trying to compare against - no need to compare it to itself
    if (envName === "prod") {
      continue;
    }

    result[envName] = {};

    for (const [orcs, park] of Object.entries(envData)) {
      // unique names found in subareas for this park in this env
      const names = new Set(park.subareas.map((subarea) => subarea.name));

      // unique names found in subareas for this park in prod
      const prodNames = new Set(
        (prodParksWithSubareas[orcs]?.subareas || []).map(
          (subarea) => subarea.name,
        ),
      );

      // missingInProd: subareas that exist in this env but not in prod (will be marked as inactive later)
      // missingHere: subareas that exist in prod but not in this env (will be created later)
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
  // This method will return a map of subareas by name for each env
  // {
  //   envName: {
  //     orcs: {
  //       subareaName: subareaId
  //     }
  //   }
  // }
  const output = {};
  const envNames = ["prod", "dev", "test", "alphaDev", "alphaTest"];

  // Loop through all envs
  for (const envName of envNames) {
    output[envName] = {};
    const envData = envs[envName]?.data;

    // subareas for this env
    const subareas = getModelData(envData, "park-operation-sub-area");

    for (const subarea of subareas.items) {
      // get park object for this subarea, we need its orcs
      const parkId = getParkId(subarea);
      const park = getModelDataById(envData, "protected-area", parkId);

      if (!park) {
        continue;
      }

      const orcs = park.attributes.orcs;

      if (!output[envName][orcs]) {
        output[envName][orcs] = {};
      }

      // this will help get a subarea id based on env, orcs, and subarea name
      output[envName][orcs][subarea.attributes.parkSubArea] = subarea.id;
    }
  }

  return output;
}

function getSubareaIdByName(subareasMap, envName, orcs, name) {
  // this method uses the result of getSubareasNameMap
  // we will need to get a subarea ID for a given env, orcs, and subarea name
  // this will be used as a FK when creating subareas in env
  return subareasMap[envName][orcs][name];
}

function getItemsToCreate(envNameDifferences, subareasMap) {
  /*
  Items that will be created in env: exist in prod but not here
  each park object will get a list `to_create` with a list of prod subarea IDs
  */
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    // things missing here means they are new in prod - we should create them in this env
    if (park.missingHere.length > 0) {
      park.toCreate = [];
      for (const prodSubAreaName of park.missingHere) {
        // Get prod subarea ID by name
        const prodSubareaId = getSubareaIdByName(
          subareasMap,
          "prod",
          orcs,
          prodSubAreaName,
        );

        // The prod subarea ID will later be used to get the full prod object
        // and create a new subarea in this env
        park.toCreate.push(prodSubareaId);
      }
    }
  }
}

function getItemsToMarkInactive(envNameDifferences, subareasMap, envName) {
  /*
  Items that will be marked as inactive in dev
  each park object will get a list `toMarkInactive` of env subarea IDs
  */
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    // things "missing" in prod means they are inactive or deleted - we should mark them as inactive here
    if (park.missingInProd.length > 0) {
      park.toMarkInactive = [];
      for (const envSubareaName of park.missingInProd) {
        // Get env subarea ID by name
        const envSubareaId = getSubareaIdByName(
          subareasMap,
          envName,
          orcs,
          envSubareaName,
        );

        // The env subarea ID will later be used to get the full env object
        // and mark it as inactive
        park.toMarkInactive.push(envSubareaId);
      }
    }
  }
}

function getSubareaTypeId(subarea) {
  // Helper method to get subareaTypeId from subarea
  // just to make the code more readable in other places
  return subarea?.attributes?.parkSubAreaType?.data?.id || null;
}

function getEnvSubareaTypeByName(envs, envName, subareaTypeName) {
  //  Returns park-operation-sub-area-type object based on envName and subareaTypeName
  //  Its ID will be used as FK to create subarea in env

  const envData = envs[envName]?.data;

  // all subarea types for this env
  const subareaTypes = getModelData(
    envData,
    "park-operation-sub-area-type",
  )?.items;

  if (!subareaTypes) return null;

  // return the subarea type object based on its name
  return subareaTypes.find(
    (item) => item?.attributes?.subAreaType === subareaTypeName,
  );
}

function getEnvParKByOrcs(envs, envName, orcs) {
  // Get park object based on envName and orcs
  const envData = envs[envName]?.data;

  // all parks for this env
  const parks = getModelData(envData, "protected-area")?.items;

  return parks.find((park) => park.attributes.orcs === orcs) || null;
}

function getPayloadToCreateSubarea(envs, envName, temp) {
  // keys to remove from the payload
  // these are either auto-updated or not needed when creating a new subarea
  const keysToRemove = new Set([
    "parkOperationSubAreaDates",
    "createdAt",
    "updatedAt",
    "publishedAt",
  ]);

  // Since we are using the prod subarea as a template,
  // we need to remove keys that might not be present in this env
  const sampleEnvSubarea = getModelData(
    envs[envName].data,
    "park-operation-sub-area",
  ).items[0];

  const envSubareaKeys = new Set(Object.keys(sampleEnvSubarea.attributes));

  const payload = {};

  // remove keys that are present in prod, but not on this env
  for (const [key, value] of Object.entries(temp)) {
    if (envSubareaKeys.has(key) && !keysToRemove.has(key)) {
      payload[key] = value;
    }
  }

  return payload;
}

function getPayloadToCreateDate(envs, envName, temp) {
  // these keys are auto-updated and should not be included in the payload
  const keysToRemove = new Set(["createdAt", "updatedAt", "publishedAt"]);

  // Since we are using the prod subarea date as a template,
  // we need to remove keys that might not be present in this env
  const sampleEnvDate = getModelData(
    envs[envName].data,
    "park-operation-sub-area-date",
  ).items[0];

  const envDateKeys = new Set(Object.keys(sampleEnvDate.attributes));

  const payload = {};

  // remove keys that are present in prod, but not on this env
  for (const [key, value] of Object.entries(temp)) {
    if (envDateKeys.has(key) && !keysToRemove.has(key)) {
      payload[key] = value;
    }
  }

  return payload;
}

function getEnvToken() {
  // Strapi token to interact with the API
  return process.env.STRAPI_TOKEN;
}

async function createSubareaInStrapi(envs, envName, subarea) {
  try {
    // API URL for the env
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-areas/`;

    const strapiToken = getEnvToken();

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    // Strapi required the data to be wrapped in a `data` object
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
    // API URL for the env
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-area-dates/`;

    const strapiToken = getEnvToken(envName);

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    // Strapi required the data to be wrapped in a `data` object
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

  // based on prod subarea ID, get the full prod subarea object
  // it will be used as a template to create a new subarea in this env
  const prodSubarea = getModelDataById(
    prodData,
    "park-operation-sub-area",
    prodSubareaId,
  );

  // we need to remove the ID from the object
  const obj = { ...prodSubarea.attributes };

  // get subarea type object in prod
  const prodSubareaTypeId = getSubareaTypeId(prodSubarea);
  const prodSubareaType = getModelDataById(
    prodData,
    "park-operation-sub-area-type",
    prodSubareaTypeId,
  );
  const prodSubareaTypeName = prodSubareaType.attributes.subAreaType;

  // based on the subarea type name in prod,
  // get the subarea type object in this env
  const envSubareaType = getEnvSubareaTypeByName(
    envs,
    envName,
    prodSubareaTypeName,
  );
  const envSubareaTypeId = envSubareaType.id;

  // assign env subarea type ID to subarea (FK)
  obj.parkSubAreaType = envSubareaTypeId;

  // assign env park ID to subarea (FK)
  const envPark = getEnvParKByOrcs(envs, envName, orcs);
  const envParkId = envPark.id;

  obj.protectedArea = envParkId;

  // remove keys that are not needed when creating a new subarea
  const payload = getPayloadToCreateSubarea(envs, envName, obj);

  // add a global ID to the payload - this will be shared across envs
  payload.globalId = `${orcs}_${prodSubareaId}`;

  // send to API and get response
  const createdSubarea = await createSubareaInStrapi(envs, envName, payload);

  // check if there are dates that need to be created for this subarea
  const datesData = prodSubarea?.attributes?.parkOperationSubAreaDates;

  if (!datesData) {
    return createdSubarea;
  }

  const dates = datesData?.data || [];

  createdSubarea.meta = {
    dates: [],
  };

  // for every date this subarea has in prod, create a new date in this env
  for (const date of dates) {
    // get the full prod date object
    const dateId = date.id;
    const prodDate = getModelDataById(
      prodData,
      "park-operation-sub-area-date",
      dateId,
    );

    // skip inactive dates
    if (!prodDate.attributes.isActive) {
      continue;
    }

    // remove the ID from the object
    const tempDate = { ...prodDate.attributes };

    // remove keys that are not needed when creating a new date
    const datePayload = getPayloadToCreateDate(envs, envName, tempDate);

    // assign env park ID to date (FK) - the ID from the subarea creation response
    datePayload.parkOperationSubArea = createdSubarea.id;

    // send to API and get response
    const createdDate = await createDateInStrapi(envs, envName, datePayload);

    // add the created date to the subarea meta
    createdSubarea.meta.dates.push(createdDate);
  }

  return createdSubarea;
}

function getEnvNameDifferences(nameDifferences, envName) {
  // Get the differences for a specific env
  return nameDifferences[envName];
}

async function getEnvDataToCreate(envs, nameDifferences, envName) {
  // Get the data to create in a specific env
  const envNameDifferences = getEnvNameDifferences(nameDifferences, envName);
  const result = [];

  // loop through all parks in this env
  for (const [orcs, park] of Object.entries(envNameDifferences)) {
    // if park has subareas to create, they will be in the `toCreate` list
    // each item in the list is a prod subarea ID
    if (park.toCreate) {
      for (const toCreateId of park.toCreate) {
        const response = await createSubareaInEnv(
          envs,
          orcs,
          toCreateId,
          envName,
        );

        result.push(response);
      }
    }
  }

  return result;
}

function removeKeysFromPayload(temp) {
  // This method is used for updating subareas
  // Some of these fields are auto-updated and the others are not needed as they are FKs
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

async function updateStrapiSubarea(envs, envName, subareaId, payload) {
  try {
    // send PUT (update) request to the API
    const apiUrl = envs[envName]?.apiUrl;
    const fullUrl = `${apiUrl}/park-operation-sub-areas/${subareaId}`;

    const strapiToken = getEnvToken(envName);

    const headers = {
      accept: "application/json",
      "Content-Type": "application/json",
      authorization: `Bearer ${strapiToken}`,
    };

    // Strapi requires the data to be wrapped in a `data` object
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

async function markSubareaInactive(envs, envName, subareaId) {
  try {
    // get env subarea object by ID
    const subarea = getModelDataById(
      envs[envName].data,
      "park-operation-sub-area",
      subareaId,
    );

    // remove keys that are not needed when marking a subarea as inactive
    const attrs = { ...subarea.attributes };
    const payload = removeKeysFromPayload(attrs);

    // mark as inactive
    payload.isActive = false;

    // send to API and get response
    const response = await updateStrapiSubarea(
      envs,
      envName,
      subareaId,
      payload,
    );

    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function getEnvDataToMarkInactive(envs, nameDifferences, envName) {
  // Get differences in this env
  const envNameDifferences = getEnvNameDifferences(nameDifferences, envName);
  const result = [];

  // loop through all parks in this env
  for (const park of Object.values(envNameDifferences)) {
    // if park has subareas to mark as inactive, they will be in the `toMarkInactive` list
    // each item in the list is an env subarea ID
    if (park.toMarkInactive) {
      for (const toUpdateId of park.toMarkInactive) {
        // send to API and get response
        const response = await markSubareaInactive(envs, envName, toUpdateId);

        result.push(response);
      }
    }
  }

  return result;
}

function getProdSubareaIdByOrcsAndName(prodSubareaMap, orcs, name) {
  // Get the prod subarea ID by using orcs and subarea name
  return prodSubareaMap[orcs]?.[name] || null;
}

async function getEnvDataToUpdate(
  envs,
  parksWithSubareas,
  prodSubareaMap,
  envName,
) {
  // These are the subareas that already exist in prod
  const result = [];
  const envData = parksWithSubareas[envName];

  // loop through all parks in env
  for (const [orcs, park] of Object.entries(envData)) {
    // loop through all subareas in this park
    for (const subarea of park.subareas) {
      // get the prod subarea ID by using orcs and subarea name
      const prodSubareaId = getProdSubareaIdByOrcsAndName(
        prodSubareaMap,
        orcs,
        subarea.name,
      );

      // if the subarea exists in prod, we can add the global ID to it in this env
      if (prodSubareaId) {
        // get the full env subarea object by ID
        const envSubarea = getModelDataById(
          envs[envName].data,
          "park-operation-sub-area",
          subarea.id,
        );

        // remove keys that are not needed when updating a subarea
        const attrs = { ...envSubarea.attributes };
        const payload = removeKeysFromPayload(attrs);

        // add a global ID to the payload - this will be shared across envs
        payload.globalId = `${orcs}_${prodSubareaId}`;

        // send to API and get response
        const response = await updateStrapiSubarea(
          envs,
          envName,
          subarea.id,
          payload,
        );

        result.push(response);
      }
    }
  }

  return result;
}

async function addGlobalIdToProdSubareas(envs) {
  // for prod, we don't need any cross env comparisons
  const prodData = envs.prod.data;

  const subareas = getModelData(prodData, "park-operation-sub-area").items;

  // loop through all subareas in prod
  for (const subarea of subareas) {
    const attrs = { ...subarea.attributes };

    const payload = removeKeysFromPayload(attrs);

    const park = getModelDataById(
      prodData,
      "protected-area",
      getParkId(subarea),
    );

    // add a global ID to the payload - this will be shared across envs
    // we use its own ID as part of the global ID - prod is the source of truth
    payload.globalId = `${park.attributes.orcs}_${subarea.id}`;

    await updateStrapiSubarea(envs, "prod", subarea.id, payload);
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

  // Get the items to create, mark inactive, and update
  for (const [envName, envNameDifferences] of Object.entries(nameDifferences)) {
    getItemsToCreate(envNameDifferences, subareasMap);
    getItemsToMarkInactive(envNameDifferences, subareasMap, envName);
  }

  // Add global ID to prod subareas
  addGlobalIdToProdSubareas(envs);

  const envNames = ["dev", "test", "alphaDev", "alphaTest"];

  // lets you get a prod subarea ID by using `orcs.subarea_name`
  const prodSubareaMap = subareasMap.prod;

  // These items already have a match in prod, so we'll just add the globalId to them
  for (const envName of envNames) {
    await getEnvDataToUpdate(envs, parksWithSubareas, prodSubareaMap, envName);
  }

  // These items exist in env but not in prod, so we'll mark them as inactive
  for (const envName of envNames) {
    await getEnvDataToMarkInactive(envs, nameDifferences, envName);
  }

  // These items exist in prod but not in env, so we'll create them
  for (const envName of envNames) {
    await getEnvDataToCreate(envs, nameDifferences, envName);
  }
}
