import { useState, useEffect, useRef } from "react";
import axios from "axios";
import getEnv from "../config/getEnv";

// Create an Axios instance for the API server
const axiosInstance = axios.create({
  baseURL: getEnv("VITE_API_BASE_URL"),
});

export function useApiGet(endpoint, params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSent = useRef(false);

  // Convert the params object to a string to compare changes
  const paramsString = JSON.stringify(params);

  useEffect(() => {
    async function fetchData() {
      try {
        requestSent.current = true;
        const response = await axiosInstance.get(endpoint, { params });

        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    // Prevent sending multiple requests
    if (!requestSent.current) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paramsString is a stringified object
  }, [endpoint, paramsString]);

  return { data, loading, error };
}
