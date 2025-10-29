import "../env.js";

import { Op } from "sequelize";

import {
  getItemByAttributes,
  createModel,
  getFeatureTypeIcon,
} from "./utils.js";
import winterParks from "./park-winter-dates.js";
import {
  Park,
  FeatureType,
  Feature,
  Dateable,
  DateType,
  Season,
  DateRange,
  Section,
  ManagementArea,
} from "../models/index.js";
import * as STATUS from "../constants/seasonStatus.js";
import { getAllPages } from "../utils/strapiApi.js";
import { getStrapiModelData } from "./strapi-data-service.js";

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
    dbItem.managementAreas = item.mgmtAreaAndSection;
    // Update it to false if inReservationSystem from Strapi returns null
    dbItem.inReservationSystem =
      item.parkOperation.inReservationSystem ?? false;

    await dbItem.save();
  } else {
    const dateable = await createModel(Dateable);
    const data = {
      name: item.attributes.protectedAreaName,
      orcs: item.attributes.orcs,
      dateableId: dateable.id,
      strapiId: item.id,
      managementAreas: item.mgmtAreaAndSection,
      inReservationSystem: item.parkOperation.inReservationSystem ?? false,
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

  const icon = await getFeatureTypeIcon(item);

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

function getSeasonStatus(operatingYear) {
  // if operating year is in the past, set status to published, else set to requested
  const currentYear = new Date().getFullYear();
  const status =
    operatingYear < currentYear ? STATUS.PUBLISHED : STATUS.REQUESTED;

  return status;
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
 * For the feature in strapi, create a new feature or update its corresponding existing feature
 * @param {Object} item feature data from Strapi
 * @returns {Feature} feature model
 */
export async function createOrUpdateFeature(item) {
  let dbItem = await getItemByAttributes(Feature, { strapiId: item.id });

  if (dbItem) {
    // if dbItems has parkAreaId, don't update the name
    // there is a script to create parkAreas and assign features to them
    // this script will rename the feature to fit within the parkArea
    if (!dbItem.parkAreaId) {
      dbItem.name = item.parkSubArea;
    }

    const featureType = await getItemByAttributes(FeatureType, {
      strapiId: item.parkSubAreaType.id,
    });

    dbItem.featureTypeId = featureType.id;
    dbItem.active = item.isActive;
    dbItem.strapiFeatureId = item.featureId;

    dbItem.hasReservations = item.hasReservations;
    // Update it to false if inReservationSystem from Strapi returns null
    dbItem.inReservationSystem = item.inReservationSystem ?? false;
    dbItem.hasBackcountryPermits = item.hasBackcountryPermits ?? false;

    await dbItem.save();
  } else {
    const dateable = await createModel(Dateable);
    const park = await getItemByAttributes(Park, {
      strapiId: item.protectedArea.id,
    });
    const featureType = await getItemByAttributes(FeatureType, {
      strapiId: item.parkSubAreaType.id,
    });

    const data = {
      name: item.parkSubArea,
      parkId: park.id,
      featureTypeId: featureType.id,
      dateableId: dateable.id,
      hasReservations: item.hasReservations,
      inReservationSystem: item.inReservationSystem ?? false,
      hasBackcountryPermits: item.hasBackcountryPermits ?? false,
      active: item.isActive,
      strapiId: item.id,
      strapiFeatureId: item.featureId,
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
 * Check if two date ranges overlap
 * @param {Object} range1 date range 1
 * @param {Object} range2 date range 2
 * @returns {boolean} true if the date ranges overlap
 */
function datesOverlap(range1, range2) {
  const range1Start = new Date(range1.start);
  const range1End = new Date(range1.end);

  const range2Start = new Date(range2.start);
  const range2End = new Date(range2.end);

  return range1Start <= range2End && range1End >= range2Start;
}

/**
 * This method will only run once to import existing dates in Strapi.
 * Additionally, this will be used to create the seasons needed to group the dates
 * @param {Object} datesData strapi data for park operation sub area dates
 * @returns {Promise[Object]} resolves when all dates and seasons have been created
 */
export async function createDatesAndSeasons(datesData) {
  const items = datesData.items.filter((item) => item.isActive);

  const subareaIds = [
    ...new Set(items.map((item) => item.parkOperationSubArea?.id)),
  ];

  // create feature map
  const features = await Feature.findAll(
    {
      where: {
        strapiId: {
          [Op.in]: subareaIds,
        },
      },
      attributes: [
        "id",
        "strapiId",
        "dateableId",
        "featureTypeId",
        "parkId",
        "active",
      ],
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id", "orcs"],
        },
      ],
    },
    { raw: true },
  );
  const featureMap = new Map();

  features.forEach((feature) => {
    featureMap.set(feature.strapiId, feature);
  });

  const winterSeasonMap = new Map();
  const seasonMap = new Map();

  const dateTypeMap = {};
  const featureTypeMap = {};

  // map to quickly get dateType by name
  const dateTypes = await DateType.findAll();

  dateTypes.forEach((dateType) => {
    dateTypeMap[dateType.name] = dateType;
  });

  const featureTypes = await FeatureType.findAll();

  featureTypes.forEach((featureType) => {
    featureTypeMap[featureType.name] = featureType;
  });

  const potentialWinterDates = {};

  await Promise.all(
    items.map(async (item) => {
      // if there is no subAreaId, we can't create a date range because the date is orphaned
      const subAreaId = item.parkOperationSubArea?.id;

      if (!subAreaId) {
        return;
      }

      const feature = featureMap.get(subAreaId);

      if (feature && feature.active) {
        const featureTypeId = feature.featureTypeId;
        const parkId = feature.parkId;
        const operatingYear = item.operatingYear;

        // a season is defined by the park, featureType, and operatingYear
        // this key will be used later to create season objects if they don't exist
        const key = `${parkId}-${featureTypeId}-${operatingYear}`;

        if (!seasonMap.has(key)) {
          seasonMap.set(key, []);
        }

        seasonMap.get(key).push(item);

        // if the date has offseason dates, and feature is a frontcountry parkArea
        // create winter season
        if (
          feature.park.orcs in winterParks &&
          feature.featureTypeId ===
            featureTypeMap["Frontcountry campground"].id &&
          [2023, 2024].includes(operatingYear)
        ) {
          // get the winter park dates for this year (only 2023 and 2024)
          const winterParkDates = winterParks[feature.park.orcs][operatingYear];

          // check if date is within jan-april or oct-dec
          const janAprDates = winterParkDates.janApril;
          const octDecDates = winterParkDates.octDec;

          const startDate = item.serviceStartDate;
          const endDate = item.serviceEndDate;

          if (
            datesOverlap({ start: startDate, end: endDate }, janAprDates) ||
            datesOverlap({ start: startDate, end: endDate }, octDecDates)
          ) {
            const winterSeasonKey = `${parkId}-${operatingYear}`;

            if (!winterSeasonMap.has(winterSeasonKey)) {
              winterSeasonMap.set(winterSeasonKey, new Set());
            }

            winterSeasonMap.get(winterSeasonKey).add(feature.strapiId);
          }

          // if the date has offseason dates, store them so we can easily access them later
          // we'll need them to create dates that will populate the winter season
          if (item.offSeasonStartDate || item.offSeasonEndDate) {
            if (!potentialWinterDates[feature.park.id]) {
              potentialWinterDates[feature.park.id] = {};
            }

            if (!potentialWinterDates[feature.park.id][operatingYear]) {
              potentialWinterDates[feature.park.id][operatingYear] = [];
            }

            potentialWinterDates[feature.park.id][operatingYear].push(item);
          }
        }
      }
    }),
  );

  const datesToCreate = [];

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
      const seasonStatus = getSeasonStatus(operatingYear);

      const data = {
        status: seasonStatus,
        readyToPublish: true,
        editable: seasonStatus === STATUS.REQUESTED,
        ...attrs,
      };

      season = await createModel(Season, data);
    }

    seasonDates.forEach(async (date) => {
      // for each date in the season, we create 1+ date ranges
      const feature = featureMap.get(date.parkOperationSubArea.id);

      // a single date in strapi can map to multiple date ranges in our DB
      // we create separate instances with its own dateType
      if (date.serviceStartDate || date.serviceEndDate) {
        const dateObj = {
          startDate: date.serviceStartDate,
          endDate: date.serviceEndDate,
          dateTypeId: dateTypeMap.Operation.id,
          dateableId: feature.dateableId,
          seasonId: season.id,
          adminNote: date.adminNote,
        };

        datesToCreate.push(dateObj);
      }
      if (date.reservationStartDate || date.reservationEndDate) {
        const dateObj = {
          startDate: date.reservationStartDate,
          endDate: date.reservationEndDate,
          dateTypeId: dateTypeMap.Reservation.id,
          dateableId: feature.dateableId,
          seasonId: season.id,
          adminNote: date.adminNote,
        };

        datesToCreate.push(dateObj);
      }
    });
  }

  await DateRange.bulkCreate(datesToCreate);

  const winterDatesToCreate = [];
  const featuresWithWinterFees = new Set();

  for (const [key, featureIds] of winterSeasonMap) {
    const [parkId, operatingYear] = key.split("-");

    const featureTypeId = featureTypeMap["Winter fee"].id;

    // Try to get the season by parkId, winterFeatureType.id, and operatingYear
    const attrs = {
      parkId,
      featureTypeId,
      operatingYear,
    };

    let season = await getItemByAttributes(Season, attrs);

    if (!season) {
      // create season if a season matching those 3 attributes doesn't exist
      // needs to be created before creating date ranges, because date ranges need a seasonId
      const seasonStatus = getSeasonStatus(operatingYear);

      const data = {
        status: seasonStatus,
        readyToPublish: true,
        editable: seasonStatus === STATUS.REQUESTED,
        ...attrs,
      };

      season = await createModel(Season, data);
    }

    // for each featureId in the season we create one date range using its dateableId
    const featureIDList = Array.from(featureIds);

    await Promise.all(
      featureIDList.map(async (featureId) => {
        const feature = await getItemByAttributes(Feature, {
          strapiId: featureId,
        });

        const potentialFeatureDates =
          potentialWinterDates[parkId][operatingYear];

        let addedCount = 0;

        if (potentialFeatureDates) {
          potentialFeatureDates.forEach((date) => {
            if (date.parkOperationSubArea.id === featureId) {
              const dateObj = {
                startDate: date.offSeasonStartDate,
                endDate: date.offSeasonEndDate,
                dateTypeId: dateTypeMap["Winter fee"].id,
                dateableId: feature.dateableId,
                seasonId: season.id,
                adminNote: date.adminNote,
              };

              winterDatesToCreate.push(dateObj);
              addedCount++;
            }
          });
        }

        // If no existing offseasons dates exist for this feature, create a date range with null dates
        if (addedCount === 0) {
          const dateObj = {
            startDate: null,
            endDate: null,
            dateTypeId: dateTypeMap["Winter fee"].id,
            dateableId: feature.dateableId,
            seasonId: season.id,
          };

          winterDatesToCreate.push(dateObj);
        }
        featuresWithWinterFees.add(feature.id);
      }),
    );
  }

  await DateRange.bulkCreate(winterDatesToCreate);
}

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
  const parkData = await getStrapiModelData("protected-area");
  const mgmtAreaData = await getStrapiModelData("management-area");
  const sectionData = await getStrapiModelData("section");
  const parkOperationData = await getStrapiModelData("park-operation");

  // Add mgmt area and section data to parkData
  parkData.items = parkData.items.map((park) => {
    // Get management area and section data for the JSONB column
    const mgmtAreaAndSection = park.attributes.managementAreas.data.map((m) => {
      const mgmtAreaJson = mgmtAreaData.items.find(
        (mgmtArea) => mgmtArea.id === m.id,
      );

      const sectionJson = sectionData.items.find(
        (section) => section.id === mgmtAreaJson.section.id,
      );

      return {
        mgmtArea: {
          strapiId: mgmtAreaJson.id,
          name: mgmtAreaJson.managementAreaName,
          number: mgmtAreaJson.managementAreaNumber,
        },
        section: {
          strapiId: sectionJson.id,
          name: sectionJson.sectionName,
          number: sectionJson.sectionNumber,
        },
      };
    });

    // Add parkOperation data to the parkData
    const parkOperationLookup = Object.fromEntries(
      parkOperationData.items.map((item) => [item.id, item]),
    );
    const parkOperationAttributes =
      parkOperationLookup[park.attributes.parkOperation.data?.id] || {};
    const parkOperation = parkOperationAttributes.attributes || {};
    const { inReservationSystem } = parkOperation;

    return {
      ...park,
      mgmtAreaAndSection,
      parkOperation: {
        inReservationSystem,
      },
    };
  });

  const featureTypeData = await getStrapiModelData(
    "park-operation-sub-area-type",
  );
  const featureData = await getStrapiModelData("park-operation-sub-area");

  await syncParks(parkData);
  // featureTypes need other strapi data to get the icon from campingType or facilityType
  await syncFeatureTypes(featureTypeData, featureTypeData);
  await syncFeatures(featureData);
  await syncSections(sectionData);
  await syncManagementAreas(mgmtAreaData);
}

/**
 * Create a new featureType for winter fees that doesn't exist in Strapi
 * @returns {Promise[Object]} resolves when the featureType has been created
 */
async function createWinterFeatureType() {
  const data = {
    name: "Winter fee",
    strapiId: null,
    icon: "winter-recreation",
  };

  await createModel(FeatureType, data);
}

/**
 * Syncs dates data from Strapi to our database
 * Only runs one time to import existing dates in Strapi
 * @returns {Promise[Object]} resolves when all dates and seasons have been created
 */
export async function oneTimeDataImport() {
  // only meant to run once - not needed for regular sync
  const url = `${process.env.STRAPI_URL}/api`;

  const datesData = {
    endpoint: "/park-operation-sub-area-dates",
    model: "park-operation-sub-area-date",
    fields: ["parkOperationSubArea"],
    items: [],
  };

  const currentUrl = url + datesData.endpoint;

  await createWinterFeatureType();

  datesData.items = await getAllPages(currentUrl, {
    populate: { parkOperationSubArea: { fields: ["id"] } },
  });

  await createDatesAndSeasons(datesData);
}
