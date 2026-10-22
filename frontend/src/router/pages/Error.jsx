import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

/**
 * Route error boundary page (used as `errorElement` in the router config).
 * Shows the error thrown while rendering a route: either a render error,
 * or a fatal error that a page re-threw from its own state.
 * @returns {JSX.Element} The error page
 */
export default function ErrorPage() {
  const error = useRouteError();

  console.error(error);

  let message = "Unknown error";

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
  } else if (error?.message) {
    message = error.message;
  }

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
    </div>
  );
}
