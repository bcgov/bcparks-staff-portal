import { useCallback, useContext, useMemo } from "react";
import AccessContext from "@/contexts/AccessContext";
import { ROLES } from "@/config/permissions";

export default function useAccess() {
  const { roles, checkAccess, logOut, isAuthenticated } =
    useContext(AccessContext);

  const hasAnyRole = useCallback(
    (rolesToCheck) => rolesToCheck.some((role) => checkAccess(role)),
    [checkAccess],
  );

  // Park operators are contributors who aren't also submitters or approvers.
  const isParkOperator = useMemo(
    () =>
      checkAccess(ROLES.DOOT_CONTRIBUTOR) &&
      !checkAccess(ROLES.DOOT_APPROVER) &&
      !checkAccess(ROLES.DOOT_SUBMITTER),
    [checkAccess],
  );

  return {
    roles,
    checkAccess,
    ROLES,
    logOut,
    isAuthenticated,
    hasAnyRole,
    isParkOperator,
  };
}
