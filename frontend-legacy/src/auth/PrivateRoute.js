import { useKeycloak } from "@react-keycloak/web";
import React, { useState, useEffect } from "react";
import Error from "../components/page/error/Error";
import { hasRole } from "../utils/AuthenticationUtil";

export function PrivateRoute({ children, roles }) {
  const { keycloak, initialized } = useKeycloak();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [toError, setToError] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setIsLoading(true);
      setIsAuthorized(false);
    } else if (!keycloak.authenticated) {
      setToError(true);
    }
    if (initialized) {
      setIsAuthorized(hasRole(initialized, keycloak, roles));
      setIsLoading(false);
    }
  }, [setIsAuthorized, setIsLoading, initialized, keycloak, roles]);

  if (toError) {
    return (
      <Error
        page={{
          error: {
            status: 401,
            message: "Login required",
          },
        }}
      />
    );
  }

  if (isLoading) {
    return null;
  }

  if (isAuthorized) {
    return children;
  } else {
    if (hasRole(initialized, keycloak, ["doot-user"])) {
      // if the user doesn't have staff portal access but they have DOOT access
      // send them to the DOOT app
      window.location.replace("/dates/");
      return null;
    }
    return (
      <Error
        page={{
          error: {
            status: 403,
            message: "Unauthorized",
          },
        }}
      />
    );
  }
}
