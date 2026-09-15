import strapiApi from "./strapiApi.js";

/**
 * Adds a task to the Strapi queued-tasks collection.
 * @param {Object} task Task data
 * @param {string} task.action Strapi task action
 * @param {number} [task.numericData] Optional numeric task data
 * @param {Object|Array} [task.jsonData] Optional JSON task data
 * @returns {Promise<Object>} Strapi API response
 */
export async function queueStrapiTask({ action, numericData, jsonData }) {
  const response = await strapiApi.post("/queued-tasks", {
    data: {
      action,
      numericData,
      jsonData,
    },
  });

  return response.data;
}

export default queueStrapiTask;
