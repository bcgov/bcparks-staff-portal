import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import getEnv from "../config/getEnv";

// Create an Axios instance for the API server
const axiosInstance = axios.create({
  baseURL: getEnv("VITE_API_BASE_URL"),
});

export function useApiGet(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const requestSent = useRef(false);

  // Parse options:
  // URL parameters
  const params = options.params ?? {};
  // Instantly start the request. Set false to call fetchData manually
  const instant = options.instant ?? true;

  // If instant is true, the request will be sent immediately
  const [loading, setLoading] = useState(instant);

  // Convert the params object to a string to compare changes
  const paramsString = JSON.stringify(params);

  // Define fetchData as a callback so it can be used outside
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      requestSent.current = true;

      const response = await axiosInstance.get(endpoint, { params });

      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps -- paramsString is a stringified object
  }, [endpoint, paramsString]);

  useEffect(() => {
    // Prevent sending multiple requests
    if (instant && !requestSent.current) {
      fetchData();
    }
  }, [fetchData, instant]);

  // Return fetchData so it can be called externally
  return { data, loading, error, fetchData };
}

export async function post(endpoint, data) {
  // send POST request
  const response = await axiosInstance.post(endpoint, data);

  return response;
}
