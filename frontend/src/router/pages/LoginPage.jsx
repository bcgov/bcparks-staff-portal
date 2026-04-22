import { useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import getEnv from "@/config/getEnv";
import "./LoginPage.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fa-kit/icons/classic/regular";

export default function LoginPage() {
  const auth = useAuth();

  // function to redirect to Keycloak for the selected login provider
  const handleLogin = useCallback(
    (idp) => {
      auth.signinRedirect({
        // eslint-disable-next-line camelcase -- 'redirect_uri' is required by Keycloak
        redirect_uri: new URL("/", getEnv("VITE_FRONTEND_BASE_URL")).toString(),
        extraQueryParams: {
          // eslint-disable-next-line camelcase -- 'kc_idp_hint' is required by Keycloak
          kc_idp_hint: idp,
        },
      });
    },
    [auth],
  );

  useEffect(() => {
    // if the login_idp is already set in session storage, use that to log in automatically
    const savedIdp = sessionStorage.getItem("login_idp");

    if (savedIdp) {
      // delete the saved IDP to avoid infinite redirects
      sessionStorage.removeItem("login_idp");
      handleLogin(savedIdp);
    }
  }, [handleLogin]);

  // if already authenticated, don't show the login page
  if (auth.isAuthenticated) {
    // Redirect to "/" (which will redirect to a dashboard)
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container">
      <div className="text-center login-page-content">
        <h2 className="mt-5 mb-2">Staff web portal</h2>
        <p>Use one of the following methods to log in</p>

        {/* Uncomment the following section if you want to enable BC Services Card login */}
        {/* <p className="mt-5 mb-1">
          <button
            className="btn btn-primary"
            onClick={() => handleLogin("bcsc")}
          >
            Log in with BC Services Card
          </button>
        </p>
        <p>
          <a href="https://www2.gov.bc.ca/gov/content/governments/government-id/bcservicescardapp/setup">
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="me-1" />
            Set up the BC Services Card App
          </a>
        </p> */}

        <p className="mb-1 mt-5">
          <button
            className="btn btn-primary"
            onClick={() => handleLogin("bceid")}
          >
            Log in with BCeID
          </button>
        </p>
        <p>
          <a
            href="https://www.bceid.ca/os/?11849"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="me-1" />
            Register for a BCeID
          </a>
        </p>

        <p className="mt-5 mb-5">
          <button
            className="btn btn-primary"
            onClick={() => handleLogin("idir")}
          >
            Log in with IDIR
          </button>
        </p>

        <p className="mb-4">
          Can&apos;t log in? Contact the web team at{" "}
          <a href="mailto:parksweb@gov.bc.ca">parksweb@gov.bc.ca</a>
        </p>

        <p className="mb-4">
          If you are a park operator looking to report an advisory,
          <br />
          please contact your regional staff representative.
          <br />
          <br />
          Business hours of the web team: <br />
          Monday&ndash;Friday, 8:30am&ndash;4:30pm
        </p>
      </div>
    </div>
  );
}
