import { useCallback, useContext } from "react";
import AccessContext from "@/contexts/AccessContext";
import { ROLES } from "@/config/permissions";

export default function useAccess() {
  const { roles, checkAccess, logOut, isAuthenticated } =
    useContext(AccessContext);

  const hasAnyRole = useCallback(
    (rolesToCheck) => rolesToCheck.some((role) => checkAccess(role)),
    [checkAccess],
  );

  return { roles, checkAccess, ROLES, logOut, isAuthenticated, hasAnyRole };
}
