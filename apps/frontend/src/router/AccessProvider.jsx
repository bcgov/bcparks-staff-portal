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

    return [...payloadRoles];
  }, [auth?.user?.access_token]);

  // @TODO: implement fine-grained permission checks here
  const checkAccess = useCallback(
    (requiredRole) => {
      // Super admin can access everything
      if (roles.includes(ROLES.SUPER_ADMIN)) return true;

      return roles.includes(requiredRole);
    },
    [roles],
  );

  // Log out of Keycloak (and show the login page again)
  async function logOut() {
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
  }

  // Provide the context value to child components
  return (
    <AccessContext.Provider
      value={{
        roles,
        checkAccess,
        logOut,
        isAuthenticated: auth.isAuthenticated,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

// prop validation
AccessProvider.propTypes = {
  children: PropTypes.node,
  auth: PropTypes.object,
};
