import { useContext } from "react";
import { useRouteError } from "react-router-dom";
import ErrorContext from "@/contexts/ErrorContext";
import LegacyErrorPage from "@/router/pages/advisories/error/Error";

export default function ErrorPage() {
  // Get the error from the route context (errorElement)
  const routeError = useRouteError();
  const { error: contextError } = useContext(ErrorContext);

  console.error(routeError);

  // If the routeError is null, it means this page was rendered manually
  // via setError in ErrorProvider, so get the error message from the ErrorProvider context instead.
  if (routeError === null && contextError) {
    console.error("contextError:", contextError);
    // Render the Legacy error page with the context error message
    return <LegacyErrorPage error={contextError} />;
  }

  return (
    <div id="error-page">
      <div className="container my-2">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>{routeError?.statusText || routeError?.message}</i>
        </p>
      </div>
    </div>
  );
}
