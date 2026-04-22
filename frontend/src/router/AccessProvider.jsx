import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import getEnv from "@/config/getEnv";
import { ROLES } from "@/config/permissions";

import AccessContext from "@/contexts/AccessContext";

export default function AccessProvider({ children, auth }) {
  // Decode the token to get the user's roles
  const roles = useMemo(() => {
    const accessToken = auth?.user?.access_token;
    const clientId = getEnv("VITE_OIDC_CLIENT_ID"); // "staff-portal"

    if (!accessToken) return [];

    const payload = accessToken.split(".").at(1);
    const decodedPayload = atob(payload);
    const parsedPayload = JSON.parse(decodedPayload);
    const payloadRoles =
      parsedPayload?.resource_access?.[clientId]?.roles ?? [];

    return payloadRoles.toSorted();
  }, [auth?.user?.access_token]);

  // The roles array gets recreated on every token refresh, even if the roles themselves do not change.
  // Memoize it to prevent unnecessary re-renders and recalculations in consuming components.

  // Stringify the roles array to use as a key for memoization
  const rolesKey = useMemo(() => JSON.stringify(roles), [roles]);
  const memoizedRoles = useMemo(() => JSON.parse(rolesKey), [rolesKey]);

  // @TODO: implement fine-grained permission checks here
  const checkAccess = useCallback(
    (requiredRole) => {
      // Super admin can access everything
      if (memoizedRoles.includes(ROLES.SUPER_ADMIN)) return true;

      return memoizedRoles.includes(requiredRole);
    },
    [memoizedRoles],
  );

  // Log out of Keycloak (and show the login page again)
  const logOut = useCallback(async () => {
    auth.stopSilentRenew();
    await auth.clearStaleState();

    auth
      .removeUser()
      .then(() => {
        auth.signoutRedirect();
      })
      .catch(() => {
        auth.signoutRedirect();
      });
  }, [auth]);

  // Memoize the context value to prevent unnecessary re-renders in consuming components
  const providerValue = useMemo(
    () => ({
      roles: memoizedRoles,
      checkAccess,
      logOut,
      isAuthenticated: auth.isAuthenticated,
    }),
    [memoizedRoles, checkAccess, logOut, auth.isAuthenticated],
  );

  // Provide the context value to child components
  return (
    <AccessContext.Provider value={providerValue}>
      {children}
    </AccessContext.Provider>
  );
}

// prop validation
AccessProvider.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object,
};
