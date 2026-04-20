import { useCallback, useContext, useEffect, useRef } from "react";
import qs from "qs";
import get from "lodash-es/get";
import { useAuth } from "react-oidc-context";
import { cmsAxios } from "@/lib/advisories/axios_config";
import CmsDataContext from "@/contexts/CmsDataContext";
import { calculateIsStatHoliday as calculateIsStatHolidayUtil } from "@/lib/advisories/utils/AdvisoryUtil";

/**
 * Builds a sort query string for a single field, matching the pattern used in CmsDataUtil.
 * @param {string} key The field name to sort by
 * @returns {string} Encoded query string
 */
function querySort(key) {
  return qs.stringify(
    {
      sort: [key],
      pagination: {
        // Large number to return all items on a single page
        limit: 2000,
      },
    },
    { encodeValuesOnly: true },
  );
}

/*
 * Hook that provides access to authenticated Strapi CMS endpoints
 */
export default function useCms() {
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const auth = useAuth();

  // Store the token in a ref so it can be read at call time without
  // becoming a reactive dependency, which prevents effects from rerunning when the token refreshes.
  const accessTokenRef = useRef(auth.user?.access_token);

  useEffect(() => {
    accessTokenRef.current = auth.user?.access_token;
  }, [auth.user?.access_token]);

  /**
   * Adds the Keycloak token to an Axios request config object.
   * @param {Object} config Axios request config to extend
   * @returns {Object} Config with the Authorization header added
   */
  const withAuthorization = useCallback((config = {}) => {
    const headers = { ...config.headers };

    if (accessTokenRef.current) {
      headers.Authorization = `Bearer ${accessTokenRef.current}`;
    }

    return {
      ...config,
      headers,
    };
  }, []);

  // Authenticated wrappers around cmsAxios methods

  /**
   * Performs a GET request to the CMS and returns the nested data at the provided `path`.
   * @param {string} url CMS endpoint to fetch
   * @param {Object} [config={}] axios.get request config
   * @param {string|Array} [path="data"] lodash.get path inside the CMS response body
   * @returns {Promise<any>} The nested data at the provided path in the CMS response body
   */
  const cmsGet = useCallback(
    async (url, config = {}, path = "data") => {
      const response = await cmsAxios.get(url, withAuthorization(config));

      // If an empty path is provided, return the full CMS response body
      if (path.length === 0) {
        return response.data;
      }

      // Default to Strapi's usual data path,
      // but allow callers to request a different CMS response path such as meta.pagination
      return get(response.data, path);
    },
    [withAuthorization],
  );

  const cmsPost = useCallback(
    async (url, data, config = {}) => {
      const response = await cmsAxios.post(
        url,
        data,
        withAuthorization(config),
      );

      return response.data?.data ?? response.data;
    },
    [withAuthorization],
  );

  const cmsPut = useCallback(
    async (url, data, config = {}) => {
      const response = await cmsAxios.put(url, data, withAuthorization(config));

      return response.data?.data ?? response.data;
    },
    [withAuthorization],
  );

  /**
   * Writes a value into the shared CmsDataContext cache.
   * @param {string} key Cache key in CmsDataContext
   * @param {any} value The value to store
   * @returns {any} The stored value
   */
  const storeResult = useCallback(
    (key, value) => {
      const data = cmsData;

      data[key] = value;
      setCmsData(data);

      return value;
    },
    [cmsData, setCmsData],
  );

  /**
   * Returns cached CMS data if available, or fetches it from the CMS and caches the result.
   * @param {string} key Cache key in CmsDataContext
   * @param {string} url CMS endpoint to fetch
   * @param {string|Array} [path="data"] lodash.get path inside the CMS response body
   * @returns {Promise<any>} The value from the CMS or the CmsDataContext cache
   */
  const fetchCached = useCallback(
    async (key, url, path = "data") => {
      if (cmsData[key]) {
        return cmsData[key];
      }

      const payload = await cmsGet(url, {}, path);

      return storeResult(key, payload);
    },
    [cmsData, cmsGet, storeResult],
  );

  // Metadata getters using fetchCached so each endpoint API is hit only once per session.

  const getProtectedAreas = useCallback(
    // This custom endpoint returns an array at the response root, not under data.
    () => fetchCached("protectedAreas", "/protected-areas/items", ""),
    [fetchCached],
  );

  const getRegions = useCallback(
    () =>
      fetchCached("regions", `/regions?${querySort("regionName")}&populate=*`),
    [fetchCached],
  );

  const getSections = useCallback(
    () =>
      fetchCached(
        "sections",
        `/sections?${querySort("sectionName")}&populate=*`,
      ),
    [fetchCached],
  );

  const getManagementAreas = useCallback(() => {
    const fields = qs.stringify({
      fields: ["id", "managementAreaNumber", "managementAreaName"],
      populate: {
        protectedAreas: { fields: ["id", "protectedAreaName", "orcs"] },
        section: { fields: ["id"] },
        region: { fields: ["id"] },
      },
    });

    return fetchCached(
      "managementAreas",
      `/management-areas?${querySort("managementAreaName")}&${fields}`,
    );
  }, [fetchCached]);

  const getSites = useCallback(
    () => fetchCached("sites", `/sites?${querySort("siteName")}&populate=*`),
    [fetchCached],
  );

  const getFireCentres = useCallback(
    () =>
      fetchCached(
        "fireCentres",
        `/fire-centres?${querySort("fireCentreName")}&populate=*`,
      ),
    [fetchCached],
  );

  const getFireZones = useCallback(
    () =>
      fetchCached(
        "fireZones",
        `/fire-zones?${querySort("fireZoneName")}&populate=*`,
      ),
    [fetchCached],
  );

  const getNaturalResourceDistricts = useCallback(
    () =>
      fetchCached(
        "naturalResourceDistricts",
        `/natural-resource-districts?${querySort("naturalResourceDistrictName")}&populate=*`,
      ),
    [fetchCached],
  );

  const getRecreationDistricts = useCallback(
    () =>
      fetchCached(
        "recreationDistricts",
        `/recreation-districts?${querySort("district")}&populate=*`,
      ),
    [fetchCached],
  );

  const getEventTypes = useCallback(
    () => fetchCached("eventTypes", `/event-types?${querySort("eventType")}`),
    [fetchCached],
  );

  const getAccessStatuses = useCallback(
    () =>
      fetchCached(
        "accessStatuses",
        `/access-statuses?${querySort("precedence")}`,
      ),
    [fetchCached],
  );

  const getUrgencies = useCallback(
    () => fetchCached("urgencies", `/urgencies?${querySort("sequence")}`),
    [fetchCached],
  );

  const getAdvisoryStatuses = useCallback(
    () =>
      fetchCached(
        "advisoryStatuses",
        `/advisory-statuses?${querySort("code")}`,
      ),
    [fetchCached],
  );

  const getLinkTypes = useCallback(
    () => fetchCached("linkTypes", `/link-types?${querySort("id")}`),
    [fetchCached],
  );

  const getBusinessHours = useCallback(
    () => fetchCached("businessHours", "/business-hour"),
    [fetchCached],
  );

  const getStandardMessages = useCallback(
    () =>
      fetchCached(
        "standardMessages",
        `/standard-messages?${querySort("precedence")}`,
      ),
    [fetchCached],
  );

  /**
   * Determines whether today is a statutory holiday and updates component state.
   * Wraps the calculateIsStatHoliday function from AdvisoryUtil.js
   * @param {Function} setIsStatHoliday State setter to receive the boolean result
   * @returns {Promise<void>}
   */
  const calculateIsStatHoliday = useCallback(
    (setIsStatHoliday) =>
      calculateIsStatHolidayUtil(
        setIsStatHoliday,
        cmsData,
        setCmsData,
        accessTokenRef.current,
      ),
    [cmsData, setCmsData],
  );

  return {
    calculateIsStatHoliday,
    cmsGet,
    cmsPost,
    cmsPut,
    getProtectedAreas,
    getRegions,
    getSections,
    getManagementAreas,
    getSites,
    getFireCentres,
    getFireZones,
    getNaturalResourceDistricts,
    getRecreationDistricts,
    getEventTypes,
    getAccessStatuses,
    getUrgencies,
    getAdvisoryStatuses,
    getLinkTypes,
    getBusinessHours,
    getStandardMessages,
  };
}
