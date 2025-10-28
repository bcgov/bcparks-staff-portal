import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import useAccess from "@/hooks/useAccess";

export default function HQStaffRoute({ children }) {
  const { ROLES, hasAnyRole } = useAccess();
  const hqStaff = hasAnyRole([ROLES.APPROVER]);

  if (!hqStaff) {
    return <Navigate to="/" replace />;
  }
  return children;
}

HQStaffRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
