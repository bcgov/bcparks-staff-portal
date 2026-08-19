import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";

export default function AccessControlledRoute({ children, allowedRoles }) {
  const { hasAnyRole, isAuthenticated, checkAccess } = useAccess();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but lacks required roles, redirect appropriately
  const hasAccess = hasAnyRole(allowedRoles);

  if (!hasAccess) {
    // Use smart role-based redirect
    if (checkAccess(ROLES.DOOT_USER)) {
      return <Navigate to="/dates" replace />;
    }

    if (checkAccess(ROLES.ADVISORY_USER)) {
      return <Navigate to="/advisories-and-closures" replace />;
    }

    // If no recognized role, redirect to unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

AccessControlledRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array.isRequired,
};
