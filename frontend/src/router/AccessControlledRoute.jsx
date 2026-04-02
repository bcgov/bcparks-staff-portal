import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAccess from "@/hooks/useAccess";

export default function AccessControlledRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}) {
  const { hasAnyRole, isAuthenticated } = useAccess();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but lacks required roles, redirect to the provided location
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
