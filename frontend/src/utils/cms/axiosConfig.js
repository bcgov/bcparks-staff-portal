import axios from "axios";

import getEnv from "@/config/getEnv";

// For common config
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.get["Content-Type"] = "application/json";

const cmsAxios = axios.create({
  baseURL: `${getEnv("VITE_CMS_BASE_URL")}/api`,
});

export { cmsAxios, axios };
