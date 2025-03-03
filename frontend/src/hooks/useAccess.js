import { useContext } from "react";
import AccessContext from "@/contexts/AccessContext";
import { ROLES } from "@/config/permissions";

export default function useAccess() {
  const { roles, checkAccess, logOut } = useContext(AccessContext);

  return { roles, checkAccess, ROLES, logOut };
}
