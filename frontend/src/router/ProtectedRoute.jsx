import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hasAuthParams, useAuth } from "react-oidc-context";
import { useSessionStorage } from "usehooks-ts";
import PropTypes from "prop-types";
import AccessProvider from "@/router/AccessProvider";
import getEnv from "@/config/getEnv";
import ALLOWED_IDPS from "@/constants/allowedIdps";

const frontendBaseUrl = getEnv("VITE_FRONTEND_BASE_URL");

/**
 * Returns the original destination URL after login, removing the temporary idp helper param.
 * @param {Object} location The location object from react-router, containing pathname, search, and hash
 * @returns {string} The cleaned absolute URL for post-login redirect
 */
function getPostLoginRedirectUrl(location) {
  const query = new URLSearchParams(location.search);

  query.delete("idp");
  const cleanedSearch = query.toString();

  return new URL(
    `${location.pathname}${cleanedSearch ? `?${cleanedSearch}` : ""}${location.hash}`,
    frontendBaseUrl,
  ).toString();
}

/**
 * Returns the login path, forwarding a valid idp hint if present in the query string.
 * @param {Object} location The location object from react-router, containing search params
 * @returns {string} The login path, with idp param if valid, otherwise "/login"
 */
function getLoginPath(location) {
  const idp = new URLSearchParams(location.search).get("idp");

  if (idp && ALLOWED_IDPS.has(idp)) {
    return `/login?idp=${encodeURIComponent(idp)}`;
  }

  return "/login";
}

// Higher-order component that wraps a route component for authentication
// Wrap a "layout" component in this component to protect all of its children
// Based on the Keycloak sample repo from the react-oidc-context authors:
// https://github.com/authts/sample-keycloak-react-oidc-context/
export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Store the path to redirect to after login in session storage so it persists through the redirect flow
  const [, setPostLoginRedirectPath] = useSessionStorage(
    "post_login_redirect_path",
    "",
  );

  // Track if a redirect has happened to prevent redirect loops
  const [hasTriedSignin, setHasTriedSignin] = useState(false);

  /**
   * Immediately redirect to /login when the library detects the Keycloak
   * session has ended (e.g. killed from the admin panel) or silent renew fails.
   * This fires faster than waiting for the next render cycle.
   * See {@link https://authts.github.io/oidc-client-ts/interfaces/UserManagerEvents.html}
   */
  useEffect(() => {
    const unsubscribeSignedOut = auth.events.addUserSignedOut(() => {
      auth.removeUser();
      setPostLoginRedirectPath(getPostLoginRedirectUrl(location));
      navigate(getLoginPath(location), { replace: true });
    });

    const unsubscribeRenewError = auth.events.addSilentRenewError(() => {
      auth.removeUser();
      setPostLoginRedirectPath(getPostLoginRedirectUrl(location));
      navigate(getLoginPath(location), { replace: true });
    });

    return () => {
      unsubscribeSignedOut();
      unsubscribeRenewError();
    };
  }, [auth, navigate, setPostLoginRedirectPath, location]);

  /**
   * Attempt to automatically sign in
   * See {@link https://github.com/authts/react-oidc-context?tab=readme-ov-file#automatic-sign-in}
   */
  useEffect(() => {
    if (
      !(
        hasAuthParams() ||
        auth.isAuthenticated ||
        auth.activeNavigator ||
        auth.isLoading ||
        hasTriedSignin
      )
    ) {
      // Clean up any stale state from previous logins
      auth.clearStaleState();
      setHasTriedSignin(true);

      // Navigate to the login page, which will trigger the sign-in flow and redirect to Keycloak as needed
      if (!auth.isAuthenticated) {
        setPostLoginRedirectPath(getPostLoginRedirectUrl(location));
        navigate(getLoginPath(location), { replace: true });
      }
    }
  }, [auth, hasTriedSignin, navigate, setPostLoginRedirectPath, location]);

  // Clear broken auth state by sending the user through a fresh sign-out flow
  useEffect(() => {
    if (auth.error) {
      // If there's an error, redirect to the sign-in page
      console.error("Authentication error:", auth.error);
      console.error("Redirecting to sign-in page...");
      auth.signoutRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auth.signoutRedirect is stable; only re-run when error status changes
  }, [auth.error]);

  if (auth.error) {
    return <div>Authentication error: {auth.error?.message}</div>;
  }

  if (auth.isLoading && auth.activeNavigator !== "signinSilent") {
    return <div>Checking authentication...</div>;
  }

  if (!auth.isAuthenticated) {
    // Block rendering until authenticated, or redirecting
    return <div>Redirecting to login...</div>;
  }

  return <AccessProvider auth={auth}>{children}</AccessProvider>;
}

// Define prop types for ProtectedRoute
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
