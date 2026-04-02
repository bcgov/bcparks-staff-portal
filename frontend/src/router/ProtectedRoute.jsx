import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasAuthParams, useAuth } from "react-oidc-context";
import PropTypes from "prop-types";
import AccessProvider from "@/router/AccessProvider";

// Higher-order component that wraps a route component for authentication
// Wrap a "layout" component in this component to protect all of its children
// Based on the Keycloak sample repo from the react-oidc-context authors:
// https://github.com/authts/sample-keycloak-react-oidc-context/
export default function ProtectedRoute({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();
  // Get the query params from the URL
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

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
      navigate("/login", { replace: true });
    });

    const unsubscribeRenewError = auth.events.addSilentRenewError(() => {
      auth.removeUser();
      navigate("/login", { replace: true });
    });

    return () => {
      unsubscribeSignedOut();
      unsubscribeRenewError();
    };
  }, [auth, navigate]);

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
      setHasTriedSignin(true);

      // Only redirect if not already on the login page
      if (!auth.isAuthenticated && window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [auth, hasTriedSignin, params, navigate]);

  if (auth.error) {
    // If there's an error, redirect to the sign-in page
    console.error("Authentication error:", auth.error);
    console.error("Redirecting to sign-in page...");
    auth.signoutRedirect();
    return <div>Authentication error: {auth.error?.message}</div>;
  }

  if (auth.isLoading && auth.activeNavigator !== "signinSilent") {
    return <div>Checking authentication...</div>;
  }

  // If the URL has the "logged-out" query param, display a message
  if (params.has("logged-out")) {
    return <div>Logged out.</div>;
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
