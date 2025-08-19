import { useContext } from "react";
import AccessContext from "@/contexts/AccessContext";
import { ROLES } from "@/config/permissions";

export default function useAccess() {
  const { roles, checkAccess, logOut, isAuthenticated } =
    useContext(AccessContext);

  function hasAnyAccess(rolesToCheck) {
    return rolesToCheck.some((role) => checkAccess(role));
  }

  return { roles, checkAccess, ROLES, logOut, isAuthenticated, hasAnyAccess };
}
