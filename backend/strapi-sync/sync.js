import get from "./axios.js";
import { getItemByAttributes, getItemById, createModel } from "./utils.js";

const strapiData = [
  {
    endpoint: "/park-names",
    model: "park-name",
    fields: null,
    items: [],
  },
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

// TODO: add strapiID to Park, FeatureType, and Feature

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
  } catch (error) {
    console.error(error);
  }
}

export async function createOrUpdatePark(item) {
  // get park on our DB by strapi ID
  let dbItem = await getItemByAttributes("park", { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.protectedAreaName;
  } else {
    const dateable = await createModel("dateable");
    const data = {
      name: item.attributes.protectedAreaName,
      orcs: item.attributes.orcs,
      dateableId: dateable.id,
      strapiId: item.id,
    };

    dbItem = await createModel("park", data);
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
  let dbItem = await getItemByAttributes("featureType", { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.subAreaType;
  } else {
    const data = {
      name: item.attributes.subAreaType,
      strapiId: item.id,
      isCampingType: item.attributes.campingType.data !== null,
    };

    dbItem = await createModel("featureType", data);
  }

  return dbItem;
}

export async function featureTypes(featureTypeData) {
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
    await createModel("dateType", item);
  });
}

// def create_or_update_feature(item):
//     """
//     name: subArea.name
//     parkId: subArea.protectedArea.id
//     featureTypeId: subArea.subAreaType.id
//     dateableId: created locally
//     hasReservations: subArea.hasReservations
//     campgroundId: might need to create pair
//     active: subArea.isActive
//     """
//     db_item = get_db_item_by_id('feature', item["id"])
//     if db_item:
//         db_item['name'] = item['attributes']['parkSubArea'] # TODO: check before we do
//         feature_type = get_db_item_by_id('featureType', item['attributes']['parkSubAreaType']['data']['id'])
//         db_item['featureTypeId'] = feature_type.id
//         db_item['hasReservations'] = item['attributes']['hasReservations']
//         db_item['active'] = item['attributes']['isActive']
//     else:
//         dateable = create_db_item('dateable')
//         park = get_db_item_by_id('park', item['attributes']['protectedArea']['data']['id'])
//         feature_type = get_db_item_by_id('featureType', item['attributes']['parkSubAreaType']['data']['id'])
//         data = {
//             'name': item['attributes']['parkSubArea'],
//             'parkId': park.id,
//             'featureTypeId': feature_type.id,
//             'dateableId': dateable.id,
//             'hasReservations': item['attributes']['hasReservations'],
//             # campgrounds??
//             'active': item['attributes']['isActive'],
//         }
//         db_item = create_db_item('feature', data)

//     return db_item

// def sync_features(feature_data):
//     items = feature_data['items']

//     for item in items:
//         create_or_update_feature(item)

export async function createOrUpdateFeature(item) {
  let dbItem = await getItemByAttributes("feature", { strapiId: item.id });

  if (dbItem) {
    dbItem.name = item.attributes.parkSubArea;
    const featureType = await getItemById(
      "featureType",
      item.attributes.parkSubAreaType.data.id,
    );

    dbItem.featureTypeId = featureType.id;
    dbItem.hasReservations = item.attributes.hasReservations;
    dbItem.active = item.attributes.isActive;
  } else {
    const dateable = await createModel("dateable");
    const park = await getItemById(
      "park",
      item.attributes.protectedArea.data.id,
    );
    const featureType = await getItemById(
      "featureType",
      item.attributes.parkSubAreaType.data.id,
    );

    const data = {
      name: item.attributes.parkSubArea,
      parkId: park.id,
      featureTypeId: featureType.id,
      dateableId: dateable.id,
      hasReservations: item.attributes.hasReservations,
      active: item.attributes.isActive,
    };

    dbItem = await createModel("feature", data);
  }

  return dbItem;
}
