import { useContext } from "react";
import { AccessContext } from "@/router/AccessContext";
import { ROLES } from "@/config/permissions";

export function useAccess() {
  const { roles, checkAccess } = useContext(AccessContext);

  return { roles, checkAccess, ROLES };
}
