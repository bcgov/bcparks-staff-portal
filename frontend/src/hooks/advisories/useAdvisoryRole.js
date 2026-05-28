import { useCallback } from "react";

import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";

// Returns the createdByRole/modifiedByRole value for the user's highest advisory role.
export default function useAdvisoryRole() {
  const { hasAnyRole } = useAccess();

  const getUserAdvisoryRole = useCallback(() => {
    if (hasAnyRole([ROLES.ADVISORY_APPROVER])) return "approver";
    if (hasAnyRole([ROLES.ADVISORY_SUBMITTER])) return "submitter";
    if (hasAnyRole([ROLES.ADVISORY_CONTRIBUTOR])) return "contributor";
    return null;
  }, [hasAnyRole]);

  return { getUserAdvisoryRole };
}
