import axios from "axios";

const baseURL = `${process.env.STRAPI_URL}/api`;

const headers = {
  accept: "application/json",
  "Content-Type": "application/json",
};

if (process.env.STRAPI_API_TOKEN) {
  headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
}

// Create axios instance with strapi auth token headers
// 30 second timeout
const strapiApi = axios.create({ baseURL, headers, timeout: 30000 });

// Add request interceptor for logging
strapiApi.interceptors.request.use(
  (config) => {
    console.log(
      `Strapi API Request: ${config.method?.toUpperCase()} ${config.url}`,
    );

    return config;
  },

  (error) => {
    console.error("Strapi API Request Error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling and logging
strapiApi.interceptors.response.use(
  (response) => {
    console.log(
      `Strapi API Response: ${response.status} ${response.config.url}`,
    );

    return response;
  },

  (error) => {
    console.error("Strapi API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: baseURL + error.config?.url,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

/**
 * Fetches all pages of paginated data from a Strapi API endpoint.
 * Sends multiple GET requests as needed to retrieve all records.
 * Waits for a delay between requests to avoid rate limiting. (Default: 1 second)
 * @param {string} endpoint The Strapi API endpoint to fetch data from
 * @param {Object} params Query parameters to include in the request
 * @param {number} delay The delay between requests in milliseconds
 * @returns {Promise<Array>} - A promise that resolves to an array of all fetched data.
 */
export async function getAllPages(endpoint, params = {}, delay = 1000) {
  let allData = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await strapiApi.get(endpoint, {
        params: {
          ...params,
          "pagination[page]": currentPage,
          "pagination[pageSize]": 100, // Use max page size for efficiency
        },
      });

      const { data, meta } = response.data;

      // Add current page data to our collection
      allData = allData.concat(data);

      // Check if we have more pages
      const { page, pageCount } = meta.pagination;

      hasMore = page < pageCount;
      currentPage++;

      console.log(`Fetched page ${page}/${pageCount} from ${endpoint}`);

      // Wait for the specified delay before the next request
      // to prevent overloading the API server
      if (hasMore && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(
        `Error fetching page ${currentPage} from ${endpoint}:`,
        error,
      );
      throw error;
    }
  }

  console.log(
    `Successfully fetched all ${allData.length} records from ${endpoint}`,
  );
  return allData;
}

export default {
  client: strapiApi,
  get: strapiApi.get,
  getAllPages,
  post: strapiApi.post,
  put: strapiApi.put,
  delete: strapiApi.delete,
};
