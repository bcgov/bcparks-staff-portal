import { useState } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import getEnv from "@/config/getEnv";

/**
 * Returns which backend logged a server error, so support knows which logs to check.
 * Pages throw `new Error(message, { cause: axiosError })`, so the axios error is usually the cause.
 * @param {Error} error The error thrown to the route error boundary
 * @returns {"Strapi CMS server"|"DOOT backend server"|null} The server name for 500+ responses, or null otherwise
 */
function getServerErrorBackend(error) {
  const axiosError = error?.cause ?? error;

  if (!(axiosError?.response?.status >= 500)) return null;

  const baseUrl = axiosError.config?.baseURL ?? "";
  const cmsBaseUrl = getEnv("VITE_CMS_BASE_URL");
  const apiBaseUrl = getEnv("VITE_API_BASE_URL");

  if (cmsBaseUrl && baseUrl.startsWith(cmsBaseUrl)) return "Strapi CMS server";
  if (apiBaseUrl && baseUrl.startsWith(apiBaseUrl))
    return "DOOT backend server";

  return null;
}

/**
 * Route error boundary page (used as `errorElement` in the router config).
 * Shows the error thrown while rendering a route: either a render error,
 * or a fatal error that a page re-threw from its own state.
 * For 500+ responses it adds a small footer for whoever receives the support email,
 * naming the logs that have the details and when the error happened.
 * @returns {JSX.Element} The error page
 */
export default function ErrorPage() {
  const error = useRouteError();

  // Record the time once, so re-renders don't change it
  const [errorTime] = useState(() => new Date());

  console.error(error);

  let message = "Unknown error";

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error?.message) {
    message = error.message;
  }

  const serverErrorBackend = getServerErrorBackend(error);

  return (
    <div className="container error-page-container">
      <h1>An unexpected error has occurred</h1>
      <p>
        <i>{message}</i>
      </p>
      <p>
        Refresh the page to try again. If the problem continues, contact{" "}
        <a href="mailto:cardweb@gov.bc.ca">cardweb@gov.bc.ca</a>.
      </p>
      <Link to="/" className="btn btn-primary">
        Home
      </Link>
      {serverErrorBackend && (
        <p className="text-muted small mt-4">
          This error was logged on the {serverErrorBackend} at{" "}
          {format(errorTime, "yyyy-MM-dd h:mm:ss a", { in: tz("-07:00") })} PCT.
          Please share this if you email support.
        </p>
      )}
    </div>
  );
}
