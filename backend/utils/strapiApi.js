import axios from "axios";

// Create axios instance with strapi auth token headers
const strapiApi = axios.create({
  baseURL: process.env.STRAPI_URL,

  headers: {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
  },

  timeout: 30000, // 30 second timeout
});

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
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

// @TODO: jsdoc
export async function getAllPages(endpoint, params = {}) {
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
