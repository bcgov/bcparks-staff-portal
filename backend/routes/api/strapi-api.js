import axios from "axios";

/**
 * Get the headers to be used by all requests
 * @returns {Object} - Headers for the request
 */
function getHeaders() {
  const strapiToken = process.env.STRAPI_TOKEN;

  return {
    accept: "application/json",
    "Content-Type": "application/json",
    authorization: `Bearer ${strapiToken}`,
  };
}

/**
 * Merges the endpoint with the strapi url
 * @param {string} endpoint Api endpoint to be called
 * @returns {Object} the full url to be called
 */
function getUrl(endpoint) {
  const strapiUrl = process.env.STRAPI_URL;

  return `${strapiUrl}${endpoint}`;
}

/**
 * Sends HTTP request to the strapi API
 * @param {string} method HTTP method (get, post, put)
 * @param {any} endpoint API endpoint to be called
 * @param {any} data data to create or update Strapi records
 * @returns {Object} http response
 */
async function makeRequest(method, endpoint, data = null) {
  const url = getUrl(endpoint);
  const headers = getHeaders();
  const config = { headers };

  const response = await axios({ method, url, data, ...config });

  return response;
}

/**
 * Get data from the Strapi API
 * @param {any} endpoint endpoint to get data from the Strapi API
 * @returns {Object} http response
 */
export async function get(endpoint) {
  return makeRequest("get", endpoint);
}

/**
 * Create new records in the Strapi API
 * @param {any} endpoint endpoint to create new records in the Strapi API
 * @param {any} data data to create new records in the Strapi API
 * @returns {Object} http response
 */
export async function post(endpoint, data) {
  return makeRequest("post", endpoint, data);
}

/**
 * Update Strapi records
 * @param {any} endpoint endpoint to update Strapi records
 * @param {Object} data data to update Strapi records
 * @returns {Object} http response
 */
export async function put(endpoint, data) {
  return makeRequest("put", endpoint, data);
}
