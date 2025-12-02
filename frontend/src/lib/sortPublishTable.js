import * as FEATURE_TYPE from "../constants/featureType.js";
import { sortBy } from "lodash-es";

// ensures non-feature rows appear before features
const NON_FEATURE_SORT_INDEX = -1;

/**
 * Returns the sort index for the given feature type ID.
 * @param {number} strapiFeatureTypeId the strapi feature type ID
 * @returns {number} the sort index
 */
function getSortIndex(strapiFeatureTypeId) {
  const index = FEATURE_TYPE.SORT_ORDER.indexOf(strapiFeatureTypeId);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/**
 * Flattens the seasons into a simple array for easier sorting.
 * @param {Array} seasons the array of season objects
 * @returns {Array} the flattened array of season objects
 */
function flattenSeasons(seasons) {
  return seasons.flatMap((season) => {
    const baseRow = {
      id: season.id,
      parkName: season.parkName,
      operatingYear: season.operatingYear,
      parkAreaName: season.parkAreaName,
      readyToPublish: season.readyToPublish,
      publishableType: season.publishableType,
    };

    if (season.publishableType === "feature") {
      return [
        {
          ...baseRow,
          featureName: season.publishable.name,
          sortIndex: getSortIndex(
            season.publishable.featureType.strapiFeatureTypeId,
          ),
        },
      ];
    }

    // If publishable has features array, create a row for each feature
    if (
      season.publishable?.features &&
      season.publishable.features.length > 0
    ) {
      return season.publishable.features.map((feature) => ({
        ...baseRow,
        featureName: feature.name,
        sortIndex: getSortIndex(feature.featureType.strapiFeatureTypeId),
      }));
    }

    // Otherwise, create a single row without feature data
    return [
      {
        ...baseRow,
        featureName: "",
        sortIndex: NON_FEATURE_SORT_INDEX,
      },
    ];
  });
}

/**
 * Sorts the flattened list of seasons.
 * @param {Array} seasons the flattened array of season objects
 * @returns {Array} the sorted array of season objects
 */
function sortFlattenedSeasons(seasons) {
  // Sort the flattened list
  return sortBy(seasons, [
    (item) => item.parkName.toLowerCase(),
    "operatingYear",
    "sortIndex",
    (item) => item.parkAreaName.toLowerCase(),
    (item) => item.featureName.toLowerCase(),
  ]);
}

/**
 * Groups the sorted flattened seasons into rows with featureNames arrays.
 * @param {Array} flattened the sorted flattened array of season objects
 * @returns {Array} the grouped array of season objects
 */
function groupSeasons(flattened) {
  const groupedSeasons = [];

  const seasonMap = new Map();

  flattened.forEach((item) => {
    const key = `${item.parkName}-${item.operatingYear}-${item.parkAreaName}-${item.readyToPublish}-${item.publishableType}`;

    if (seasonMap.has(key)) {
      if (item.featureName) {
        seasonMap.get(key).featureNames.push(item.featureName);
      }
    } else {
      seasonMap.set(key, {
        id: item.id,
        parkName: item.parkName,
        operatingYear: item.operatingYear,
        parkAreaName: item.parkAreaName,
        readyToPublish: item.readyToPublish,
        featureNames: item.featureName ? [item.featureName] : [],
        publishableType: item.publishableType,
        sortIndex: item.sortIndex,
      });
    }
  });

  groupedSeasons.push(...seasonMap.values());

  return groupedSeasons;
}

/**
 * Flattens, sorts and groups the publish table data.
 * @param {Array} seasons the array of season objects to sort
 * @returns {Array} the sorted and flattened array of season objects
 */
export default function sortPublishTable(seasons) {
  const flattened = flattenSeasons(seasons);
  const sorted = sortFlattenedSeasons(flattened);

  return groupSeasons(sorted);
}
