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

  // Returns the createdByRole/modifiedByRole value for the user's highest advisory role.
  const getUserAdvisoryRole = useCallback(() => {
    if (hasAnyRole([ROLES.ADVISORY_APPROVER])) return "approver";
    if (hasAnyRole([ROLES.ADVISORY_SUBMITTER])) return "submitter";
    return "contributor";
  }, [hasAnyRole]);

  return {
    roles,
    checkAccess,
    ROLES,
    logOut,
    isAuthenticated,
    hasAnyRole,
    getUserAdvisoryRole,
  };
}
