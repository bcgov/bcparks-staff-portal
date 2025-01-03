import { useContext } from "react";
import { AccessContext } from "@/router/AccessContext";
import { ROLES } from "@/config/permissions";

export function useAccess() {
  const { roles } = useContext(AccessContext);

  // @TODO: implement a fine-grained permission checks here
  function checkAccess(requiredRole) {
    // Super admin can access everything
    if (roles.includes(ROLES.SUPER_ADMIN)) return true;

    return roles.includes(requiredRole);
  }

  return { roles, checkAccess, ROLES };
}
