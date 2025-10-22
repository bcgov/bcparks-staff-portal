import "../env.js";
import { getData } from "./strapi-client.js";
import qs from "qs";

// Cache for individual model collections
const modelCache = new Map();

// Model configuration - defines all available models and their fetch settings
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
    populate: ["parkFacilities", "parkOperation", "managementAreas"],
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
};

/**
 * Build proper Strapi query parameters
 * @param {Object} populate Populate configuration
 * @returns {URLSearchParams} Properly formatted query parameters
 */
function buildStrapiParams(populate) {
  return qs.stringify({ populate });
}

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
  const params = buildStrapiParams(config.populate);

  return await getData(url, params);
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
