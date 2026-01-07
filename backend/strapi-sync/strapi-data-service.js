import "../env.js";
import { getAllPages } from "../utils/strapiApi.js";

// Cache for individual model collections
const modelCache = new Map();

// Model configuration - defines all available models and their fetch settings
// The `populate` syntax is 100% based on Strapi's populate query syntax. See the
// Strapi docs for more info:
// https://docs-v4.strapi.io/dev-docs/api/rest/populate-select#population
const MODEL_CONFIG = {
  "park-operation": {
    endpoint: "/park-operations",
    populate: {
      protectedArea: {
        fields: ["orcs"],
      },
    },
  },
  "park-operation-sub-area": {
    endpoint: "/park-operation-sub-areas",
    populate: ["protectedArea", "parkSubAreaType"],
  },
  "park-area": {
    endpoint: "/park-areas",
    populate: {
      protectedArea: {
        fields: ["orcs"],
      },
    },
  },
  "park-operation-sub-area-date": {
    endpoint: "/park-operation-sub-area-dates",
    populate: {
      parkOperationSubArea: {
        fields: ["id", "hasBackcountryPermits"],
      },
    },
  },
  "park-feature-date": {
    endpoint: "/park-feature-dates",
    populate: {
      parkOperationSubArea: {
        fields: ["id"],
      },
    },
  },
  "protected-area": {
    endpoint: "/protected-areas",
    query: {
      fields: ["id", "orcs", "protectedAreaName", "status"],
      populate: {
        parkOperation: {
          fields: [
            "inReservationSystem",
            "hasWinterFeeDates",
            "hasTier1Dates",
            "hasTier2Dates",
          ],
        },
        managementAreas: true,
      },
      filters: { parkOperation: { $notNull: true } },
    },
  },
  "camping-type": {
    endpoint: "/camping-types",
  },
  "facility-type": {
    endpoint: "/facility-types",
  },
  "park-operation-sub-area-type": {
    endpoint: "/park-operation-sub-area-types",
    populate: ["facilityType", "campingType"],
  },
  "park-operation-date": {
    endpoint: "/park-operation-dates",
    populate: {
      protectedArea: {
        fields: ["orcs"],
      },
    },
  },
  section: {
    endpoint: "/sections",
  },
  "management-area": {
    endpoint: "/management-areas",
    populate: ["section"],
  },
  "park-feature-type": {
    endpoint: "/park-feature-types",
  },
  "park-feature": {
    endpoint: "/park-features",
    populate: {
      protectedArea: {
        fields: ["orcs"],
      },
      parkArea: {
        fields: ["orcsAreaNumber"],
      },
      parkFeatureType: {
        fields: ["featureTypeId"],
      },
    },
  },
  "park-date-type": {
    endpoint: "/park-date-types",
  },
};

/**
 * Fetch a specific model from Strapi API
 * @param {string} modelName Name of the model to fetch
 * @returns {Array} Array of items for the model
 */
async function fetchModel(modelName) {
  const config = MODEL_CONFIG[modelName];

  if (!config) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const url = `${process.env.STRAPI_URL}/api${config.endpoint}`;

  let params = {};

  if (config.populate) {
    params = { populate: config.populate };
  } else if (config.query) {
    params = config.query;
  }

  return await getAllPages(url, params, 200);
}

/**
 * Get model data from cache or fetch from Strapi if not cached
 * @param {string} modelName Name of the model to retrieve
 * @param {boolean} forceRefresh Force a fresh fetch from Strapi API
 * @returns {Array} Array of items for the model
 */
export async function getStrapiModelData(modelName, forceRefresh = false) {
  if (forceRefresh || !modelCache.has(modelName)) {
    const items = await fetchModel(modelName);

    modelCache.set(modelName, items);
  }

  const items = modelCache.get(modelName);

  // Return object with items property for backward compatibility
  return {
    items,
    model: modelName,
    endpoint: MODEL_CONFIG[modelName].endpoint,
  };
}

/**
 * Clear all cached model data
 * @returns {void}
 */
export function clearCache() {
  modelCache.clear();
}
