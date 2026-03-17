import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAccess from "@/hooks/useAccess";

export default function AccessControlledRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}) {
  const { hasAnyRole } = useAccess();
  const hasAccess = hasAnyRole(allowedRoles);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

AccessControlledRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array.isRequired,
  redirectTo: PropTypes.string,
};
