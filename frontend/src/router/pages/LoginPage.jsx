import { useEffect, useCallback, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasAuthParams, useAuth } from "react-oidc-context";
import { useSessionStorage } from "usehooks-ts";
import getEnv from "@/config/getEnv";
import "./LoginPage.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fa-kit/icons/classic/regular";
import ALLOWED_IDPS from "@/constants/allowedIdps";

const frontendBaseUrl = getEnv("VITE_FRONTEND_BASE_URL");

export default function LoginPage() {
  const auth = useAuth();
  const location = useLocation();

  // Track auto sign-in attempts to prevent multiple redirects
  const autoSigninAttempted = useRef(false);

  // Store the path to redirect to after login. Use session storage to persist through the redirect flow
  const [postLoginRedirectPath, , removePostLoginRedirectPath] =
    useSessionStorage("post_login_redirect_path", "");

  // Redirects to Keycloak with the selected login provider
  const handleLogin = useCallback(
    (idp) => {
      auth.signinRedirect({
        // eslint-disable-next-line camelcase -- 'redirect_uri' is required by Keycloak
        redirect_uri:
          postLoginRedirectPath || new URL("/", frontendBaseUrl).toString(),
        extraQueryParams: {
          // eslint-disable-next-line camelcase -- 'kc_idp_hint' is required by Keycloak
          kc_idp_hint: idp,
        },
      });
    },
    [auth, postLoginRedirectPath],
  );

  // Try to automatically sign in when an `idp` query param is provided
  useEffect(() => {
    // If auth is already in progress or completed, do nothing
    if (auth.isAuthenticated || auth.activeNavigator || auth.isLoading) {
      return;
    }

    if (autoSigninAttempted.current) return;

    const params = new URLSearchParams(location.search);

    // Don't sign in automatically in after explicit logout or after auth errors
    if (params.has("logged-out") || params.has("error") || hasAuthParams()) {
      return;
    }

    // Auto sign-in only when an `idp` query param is provided
    const queryIdp = params.get("idp");

    if (!queryIdp || !ALLOWED_IDPS.has(queryIdp)) return;

    autoSigninAttempted.current = true;
    handleLogin(queryIdp);
  }, [
    auth.isAuthenticated,
    auth.activeNavigator,
    auth.isLoading,
    handleLogin,
    location.search,
  ]);

  // Clear the stored redirect destination on explicit logout or auth error,
  // so a subsequent manual login defaults to "/"
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.has("logged-out") || params.has("error")) {
      removePostLoginRedirectPath();
    }
  }, [location.search, removePostLoginRedirectPath]);

  // Clear the stored login redirect destination after authentication succeeds
  useEffect(() => {
    if (auth.isAuthenticated && postLoginRedirectPath) {
      removePostLoginRedirectPath();
    }
  }, [
    auth.isAuthenticated,
    postLoginRedirectPath,
    removePostLoginRedirectPath,
  ]);

  // Redirect authenticated users to their original destination, or fallback to "/"
  if (auth.isAuthenticated) {
    let redirectPath = "/";

    if (postLoginRedirectPath) {
      const url = new URL(postLoginRedirectPath);

      redirectPath = `${url.pathname}${url.search}${url.hash}`;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="container">
      <div className="text-center login-page-content">
        <h2 className="mt-5 mb-2">Parks and Recreation <br />staff web portal</h2>
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
