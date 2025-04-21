import { useEffect, useMemo, useState } from "react";
import { hasAuthParams, useAuth } from "react-oidc-context";
import PropTypes from "prop-types";
import AccessProvider from "@/router/AccessProvider";

// Higher-order component that wraps a route component for authentication
// Wrap a "layout" component in this component to protect all of its children
// Based on the Keycloak sample repo from the react-oidc-context authors:
// https://github.com/authts/sample-keycloak-react-oidc-context/
export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  // Get the query params from the URL
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  // Track if a redirect has happened to prevent redirect loops
  const [hasTriedSignin, setHasTriedSignin] = useState(false);

  /**
   * Attempt to auomatically sign in
   * See {@link https://github.com/authts/react-oidc-context?tab=readme-ov-file#automatic-sign-in}
   */
  useEffect(() => {
    // If the URL has the "logged-out" query param, do not redirect
    if (params.has("logged-out")) return;

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

      auth.signinRedirect();
      setHasTriedSignin(true);
    }
  }, [auth, hasTriedSignin, params]);

  if (auth.error) {
    // If there's an error, redirect to the sign-in page
    console.error("Authentication error:", auth.error);
    console.error("Redirecting to sign-in page...");
    auth.signoutRedirect();
    return <div>Authentication error: {auth.error?.message}</div>;
  }

  if (auth.isLoading && auth.activeNavigator !== "signinSilent") {
    return <div>Redirecting...</div>;
  }

  if (!auth.isAuthenticated) {
    return <div>Logged out.</div>;
  }

  return <AccessProvider auth={auth}>{children}</AccessProvider>;
}

// Define prop types for ProtectedRoute
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
