import { get } from "./axios.js";
import {
  getItemByAttributes,
  createModel,
  getStrapiModelData,
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
import { Op } from "sequelize";

async function getPageData(url) {
  try {
    const response = await get(url);
    const data = await response.json();

    return data.data;
  } catch (error) {
    console.error(error);

    return error;
  }
}

export async function getData(url, queryParams) {
  const items = [];

  try {
    let currentUrl = url;

    if (queryParams) {
      currentUrl = `${currentUrl}?${queryParams}`;
    }

    const response = await get(currentUrl);
    const data = await response.json();
    const pagination = data.meta.pagination;

    items.push(...data.data);

    let page = 1;

    while (page < pagination.pageCount) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      page += 1;

      let paginatedUrl = currentUrl;

      if (queryParams) {
        paginatedUrl = `${paginatedUrl}&pagination[page]=${page}`;
      } else {
        paginatedUrl = `${paginatedUrl}?pagination[page]=${page}`;
      }

      const pageData = await getPageData(paginatedUrl);

      items.push(...pageData);
    }

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}

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
    {
      endpoint: "/park-operation-sub-area-dates",
      model: "park-operation-sub-area-date",
      fields: ["parkOperationSubArea"],
      items: [],
    },
  ];

  await Promise.all(
    strapiData.map(async (item) => {
      const currentUrl = url + item.endpoint;
      let qpString = null;

      if (item.fields) {
        const queryParams = [];

        for (const field of item.fields) {
          const param = `populate[${field}][fields]=id`;

          queryParams.push(param);
        }

        qpString = queryParams.join("&");
      }

      const temp = getData(currentUrl, qpString);

      item.items = temp;
    }),
  );

  return strapiData;
}

export async function createOrUpdatePark(item) {
  // get park on our DB by strapi ID
  let dbItem = await getItemByAttributes(Park, { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.protectedAreaName;
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

export async function syncParks(parkData) {
  const items = parkData.items;

  items.forEach(async (item) => {
    await createOrUpdatePark(item);
  });
}

export async function createOrUpdateFeatureType(item) {
  let dbItem = await getItemByAttributes(FeatureType, { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.subAreaType;
  } else {
    const data = {
      name: item.attributes.subAreaType,
      strapiId: item.id,
      isCampingType: item.attributes.campingType.data !== null,
    };

    dbItem = await createModel(FeatureType, data);
  }

  return dbItem;
}

export async function syncFeatureTypes(featureTypeData) {
  const items = featureTypeData.items;

  items.forEach(async (item) => {
    await createOrUpdateFeatureType(item);
  });
}

export async function createDateTypes() {
  const data = [
    {
      name: "Operation",
      startDateLabel: "",
      endDateLabel: "",
      description: "",
    },
    {
      name: "Reservation",
      startDateLabel: "",
      endDateLabel: "",
      description: "",
    },
    {
      name: "Off Season",
      startDateLabel: "",
      endDateLabel: "",
      description: "",
    },
  ];

  data.forEach(async (item) => {
    await createModel(DateType, item);
  });
}

export async function createOrUpdateFeature(item) {
  let dbItem = await getItemByAttributes(Feature, { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.parkSubArea;
    const featureType = await getItemByAttributes(FeatureType, {
      strapiId: item.attributes.parkSubAreaType.data.id,
    });

    dbItem.featureTypeId = featureType.id;
    dbItem.hasReservations = item.attributes.hasReservations;
    dbItem.active = item.attributes.isActive;
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

export async function syncFeatures(featureData) {
  const items = featureData.items.slice(400, 700);

  items.forEach(async (item) => {
    await createOrUpdateFeature(item);
  });
}

export async function createDatesAndSeasons(datesData) {
  const items = datesData.items;

  const seasonMap = new Map();
  const dateTypeMap = {};

  const dateTypes = await DateType.findAll();

  dateTypes.forEach((dateType) => {
    dateTypeMap[dateType.name] = dateType;
  });

  await Promise.all(
    items.map(async (item) => {
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

    const attrs = {
      parkId,
      featureTypeId,
      operatingYear,
    };
    let season = await getItemByAttributes(Season, attrs);

    if (!season) {
      const data = {
        status: "requested",
        readyToPublish: true,
        ...attrs,
      };

      season = await createModel(Season, data);
      console.log("inside: ", season);
    }
    seasonDates.forEach(async (date) => {
      const feature = await getItemByAttributes(Feature, {
        strapiId: date.attributes.parkOperationSubArea.data.id,
      });

      if (date.attributes.serviceStartDate || date.attributes.serviceEndDate) {
        const dateObj = {
          startDate: date.attributes.serviceStartDate,
          endDate: date.attributes.serviceEndDate,
          dateTypeId: dateTypeMap.Operation.id,
          dateableId: feature.dateableId,
          seasonId: season.id,
        };

        // console.log(dateObj);
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

        // console.log(dateObj);
        await createModel(DateRange, dateObj);
      }
    });
  }
}

export async function cleanDateables() {
  await FeatureType.destroy({
    where: {
      id: {
        [Op.notIn]: [1, 2],
      },
    },
  });
}

export async function syncData() {
  const strapiData = await fetchAllModels();

  const parkData = getStrapiModelData(strapiData, "protected-area");
  const featureTypeData = getStrapiModelData(
    strapiData,
    "park-operation-sub-area-type",
  );
  const featureData = getStrapiModelData(strapiData, "park-operation-sub-area");

  // const datesData = getStrapiModelData(strapiData, "park-operation-sub-area-date");

  await syncParks(parkData);
  await syncFeatureTypes(featureTypeData);
  await syncFeatures(featureData);

  // should only run once
  // await createDatesAndSeasons(datesData);
}
