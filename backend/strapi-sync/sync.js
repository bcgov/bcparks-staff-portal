import { get } from "./axios.js";
import {
  getItemByAttributes,
  createModel,
  getStrapiModelData,
  getFeatureTypeIcon,
} from "./utils.js";
import {
  Park,
  FeatureType,
  Feature,
  Dateable,
  DateType,
  Season,
  DateRange,
} from "../models/index.js";

/**
 * Gets data for specific page number
 * @param {string} url paginated URL
 * @returns {Array} list of items for that page
 */
async function getPageData(url) {
  try {
    const response = await get(url);

    return response.data;
  } catch (error) {
    console.error(error);

    return [];
  }
}

/**
 * Gets data for all pages for a specific model
 * @param {string} url root URL with endpoint for that model
 * @param {URLSearchParams} queryParams optional fields that need to be populated
 * @returns {Array} list of items
 */
export async function getData(url, queryParams) {
  try {
    const currentUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    const data = await get(currentUrl);

    const pagination = data.meta.pagination;

    const items = data.data;

    for (let page = 2; page <= pagination.pageCount; page++) {
      // wait 1 second per request to not overload the server
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const params = new URLSearchParams(queryParams);

      params.append("pagination[page]", page);

      const paginatedUrl = `${url}?${params.toString()}`;
      const pageData = await getPageData(paginatedUrl);

      items.push(...pageData);
    }

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Fetches data for all the models of interest asynchronously
 * @returns {Array} list of all models with thier name, endpoint, and items
 */
export async function fetchAllModels() {
  const url = "https://cms.bcparks.ca/api";

  const strapiData = [
    {
      endpoint: "/park-operations",
      model: "park-operation",
      fields: null,
      items: [],
    },
    {
      endpoint: "/park-operation-sub-areas",
      model: "park-operation-sub-area",
      fields: ["protectedArea", "parkSubAreaType"],
      items: [],
    },
    {
      endpoint: "/protected-areas",
      model: "protected-area",
      fields: ["parkFacilities", "parkOperations"],
      items: [],
    },
    {
      endpoint: "/camping-types",
      model: "camping-type",
      fields: null,
      items: [],
    },
    {
      endpoint: "/facility-types",
      model: "facility-type",
      fields: null,
      items: [],
    },
    {
      endpoint: "/park-operation-sub-area-types",
      model: "park-operation-sub-area-type",
      fields: ["facilityType", "campingType"],
      items: [],
    },
    {
      endpoint: "/park-operation-dates",
      model: "park-operation-date",
      fields: ["protectedArea"],
      items: [],
    },
  ];

  await Promise.all(
    strapiData.map(async (item) => {
      const currentUrl = url + item.endpoint;
      const params = new URLSearchParams();

      if (item.fields) {
        for (const field of item.fields) {
          params.append(`populate[${field}][fields]`, "id");
        }
      }
      item.items = await getData(currentUrl, params);
    }),
  );

  return strapiData;
}

/**
 * For the park in strapi, create a new park or update its corresponding existing park
 * @param {Object} item park data from strapi
 * @returns {Park} park model
 */
export async function createOrUpdatePark(item) {
  // get park on our DB by strapi ID
  let dbItem = await getItemByAttributes(Park, { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.protectedAreaName;

    await dbItem.save();
  } else {
    const dateable = await createModel(Dateable);
    const data = {
      name: item.attributes.protectedAreaName,
      orcs: item.attributes.orcs,
      dateableId: dateable.id,
      strapiId: item.id,
    };

    dbItem = await createModel(Park, data);
  }

  return dbItem;
}

/**
 * Syncs parks from strapi to our database
 * @param {Object} parkData park data from strapi with items to sync
 * @returns {Promise[Object]} resolves when all parks have been synced
 */
export async function syncParks(parkData) {
  const items = parkData.items;

  await Promise.all(items.map((item) => createOrUpdatePark(item)));
}

/**
 * For the featureType in strapi, create a new featureType or update its corresponding existing featureType
 * @param {Array} strapiData all strapi data
 * @param {Object} item featureType data from Strapi
 * @returns {FeatureType} featureType model
 */
export async function createOrUpdateFeatureType(strapiData, item) {
  let dbItem = await getItemByAttributes(FeatureType, { strapiId: item.id });

  const icon = getFeatureTypeIcon(strapiData, item);

  if (dbItem) {
    dbItem.name = item.attributes.subAreaType;
    dbItem.icon = icon;

    await dbItem.save();
  } else {
    const data = {
      name: item.attributes.subAreaType,
      strapiId: item.id,
      isCampingType: item.attributes.campingType.data !== null,
      icon,
    };

    dbItem = await createModel(FeatureType, data);
  }

  return dbItem;
}

/**
 * Sync featureTypes from strapi to our database
 * @param {Object} strapiData all strapi data
 * @param {Object} featureTypeData  featureType data from strapi with items to sync
 * @returns {Promise[Object]} resolves when all featureTypes have been synced
 */
export async function syncFeatureTypes(strapiData, featureTypeData) {
  const items = featureTypeData.items;

  await Promise.all(
    items.map((item) => createOrUpdateFeatureType(strapiData, item)),
  );
}

/**
 * These are not associated with any specific model in Strapi
 * We will create these manually once
 * @returns {Promise[Object]} resolves when all dateTypes have been created
 */
export async function createDateTypes() {
  const data = [
    {
      name: "Operation",
      startDateLabel: "Service Start Date",
      endDateLabel: "Service End Date",
      description: "Dates of Operation",
    },
    {
      name: "Reservation",
      startDateLabel: "Reservation Start Date",
      endDateLabel: "Reservation End Date",
      description: "Dates for Reservations",
    },
    {
      name: "Off Season",
      startDateLabel: "Winter start date",
      endDateLabel: "Winter end date",
      description: "Winter dates",
    },
  ];

  await Promise.all(data.map((item) => createModel(DateType, item)));
}

/**
 * For the feature in strapi, create a new feature or update its corresponding existing feature
 * @param {Object} item feature data from Strapi
 * @returns {Feature} feature model
 */
export async function createOrUpdateFeature(item) {
  let dbItem = await getItemByAttributes(Feature, { strapiId: item.id });

  if (dbItem) {
    // if dbItems has campgroundId, don't update the name
    // there is a script to create campgrounds and assign features to them
    // this script will rename the feature to fit within the campground
    if (!dbItem.campgroundId) {
      dbItem.name = item.attributes.parkSubArea;
    }

    const featureType = await getItemByAttributes(FeatureType, {
      strapiId: item.attributes.parkSubAreaType.data.id,
    });

    dbItem.featureTypeId = featureType.id;
    dbItem.hasReservations = item.attributes.hasReservations;
    dbItem.active = item.attributes.isActive;

    await dbItem.save();
  } else {
    const dateable = await createModel(Dateable);
    const park = await getItemByAttributes(Park, {
      strapiId: item.attributes.protectedArea.data.id,
    });
    const featureType = await getItemByAttributes(FeatureType, {
      strapiId: item.attributes.parkSubAreaType.data.id,
    });

    const data = {
      name: item.attributes.parkSubArea,
      parkId: park.id,
      featureTypeId: featureType.id,
      dateableId: dateable.id,
      hasReservations: item.attributes.hasReservations,
      active: item.attributes.isActive,
      strapiId: item.id,
    };

    dbItem = await createModel(Feature, data);
  }

  return dbItem;
}

/**
 * sync features from strapi to our database
 * @param {Object} featureData feature data from strapi with items to sync
 * @returns {Promise[Object]} resolves when all features have been synced
 */
export async function syncFeatures(featureData) {
  const items = featureData.items;

  await Promise.all(items.map((item) => createOrUpdateFeature(item)));
}

/**
 * This method will only run once to import existing dates in Strapi.
 * Additionally, this will be used to create the seasons needed to group the dates
 * @param {Object} datesData strapi data for park operation sub area dates
 * @returns {Promise[Object]} resolves when all dates and seasons have been created
 */
export async function createDatesAndSeasons(datesData) {
  const items = datesData.items;

  const seasonMap = new Map();
  const dateTypeMap = {};

  // map to quickly get dateType by name
  const dateTypes = await DateType.findAll();

  dateTypes.forEach((dateType) => {
    dateTypeMap[dateType.name] = dateType;
  });

  await Promise.all(
    items.map(async (item) => {
      // if there is no subAreaId, we can't create a date range because the date is orphaned
      const subAreaId = item.attributes.parkOperationSubArea?.data?.id;

      if (!subAreaId) {
        return;
      }

      const feature = await getItemByAttributes(Feature, {
        strapiId: subAreaId,
      });

      if (feature) {
        const featureTypeId = feature.featureTypeId;
        const parkId = feature.parkId;
        const operatingYear = item.attributes.operatingYear;

        // a season is defined by the park, featureType, and operatingYear
        // this key will be used later to create season objects if they don't exist
        const key = `${parkId}-${featureTypeId}-${operatingYear}`;

        if (!seasonMap.has(key)) {
          seasonMap.set(key, []);
        }

        seasonMap.get(key).push(item);
      }
    }),
  );

  for (const [key, seasonDates] of seasonMap) {
    const [parkId, featureTypeId, operatingYear] = key.split("-");

    // Try to get the season by parkId, featureTypeId, and operatingYear
    const attrs = {
      parkId,
      featureTypeId,
      operatingYear,
    };
    let season = await getItemByAttributes(Season, attrs);

    if (!season) {
      // create season if a season matching those 3 attributes doesn't exist
      const data = {
        status: "requested",
        readyToPublish: true,
        ...attrs,
      };

      season = await createModel(Season, data);
    }

    seasonDates.forEach(async (date) => {
      // for each date in the season, we create 1+ date ranges
      const feature = await getItemByAttributes(Feature, {
        strapiId: date.attributes.parkOperationSubArea.data.id,
      });

      // a single date in strapi can map to multiple date ranges in our DB
      // we create separate instances with its own dateType
      if (date.attributes.serviceStartDate || date.attributes.serviceEndDate) {
        const dateObj = {
          startDate: date.attributes.serviceStartDate,
          endDate: date.attributes.serviceEndDate,
          dateTypeId: dateTypeMap.Operation.id,
          dateableId: feature.dateableId,
          seasonId: season.id,
        };

        await createModel(DateRange, dateObj);
      }
      if (
        date.attributes.reservationStartDate ||
        date.attributes.reservationEndDate
      ) {
        const dateObj = {
          startDate: date.attributes.reservationStartDate,
          endDate: date.attributes.reservationEndDate,
          dateTypeId: dateTypeMap.Reservation.id,
          dateableId: feature.dateableId,
          seasonId: season.id,
        };

        await createModel(DateRange, dateObj);
      }
    });
  }
}

/**
 * Syncs data from Strapi to our database
 * Focuses on parks, featureTypes, and features
 * @returns {Promise[Object]} resolves when all data has been synced
 */
export async function syncData() {
  const strapiData = await fetchAllModels();

  const parkData = getStrapiModelData(strapiData, "protected-area");
  const featureTypeData = getStrapiModelData(
    strapiData,
    "park-operation-sub-area-type",
  );
  const featureData = getStrapiModelData(strapiData, "park-operation-sub-area");

  await syncParks(parkData);
  // featureTypes need other strapi data to get the icon from campingType or facilityType
  await syncFeatureTypes(strapiData, featureTypeData);
  await syncFeatures(featureData);
}

/**
 * Syncs dates data from Strapi to our database
 * Only runs one time to import existing dates in Strapi
 * @returns {Promise[Object]} resolves when all dates and seasons have been created
 */
export async function oneTimeDataImport() {
  // only meant to run once - not needed for regular sync
  const url = "https://cms.bcparks.ca/api";

  const datesData = {
    endpoint: "/park-operation-sub-area-dates",
    model: "park-operation-sub-area-date",
    fields: ["parkOperationSubArea"],
    items: [],
  };

  const currentUrl = url + datesData.endpoint;

  const params = new URLSearchParams();

  if (datesData.fields) {
    for (const field of datesData.fields) {
      params.append(`populate[${field}][fields]`, "id");
    }
  }

  await createDateTypes();

  datesData.items = await getData(currentUrl, params);

  await createDatesAndSeasons(datesData);
}

// syncData();
// oneTimeDataImport();
