import { useMemo, useContext } from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import "./LandingPageTabs.scss";
import UserContext from "@/contexts/UserContext";
import { NoParkAccess } from "../../components/NoParkAccess";

export default function LandingPageTabs() {
  const { ROLES, checkAccess, hasAnyRole, isAuthenticated } = useAccess();

  const { data: userData } = useContext(UserContext);

  // Check user permissions
  const { isApprover, hqStaff, hasAllParkAccess } = useMemo(
    () => ({
      isApprover: checkAccess(ROLES.APPROVER),
      hqStaff: hasAnyRole([ROLES.APPROVER]),
      hasAllParkAccess: checkAccess(ROLES.ALL_PARK_ACCESS),
    }),
    [checkAccess, hasAnyRole, ROLES.APPROVER, ROLES.ALL_PARK_ACCESS],
  );

  // This prevents flashing the tabs layout to unauthenticated users
  if (!isAuthenticated) return <></>;

  // If this user has no access to any parks, show "Access Pending"
  if (!hasAllParkAccess && userData?.accessGroups?.length === 0) {
    return <NoParkAccess />;
  }

  return (
    <div className="layout landing-page-tabs">
      <header className="section-tabs d-flex flex-column">
        <div className="container">
          <h1 className="m-3 mb-4">Dates management</h1>

          <ul className="nav nav-tabs px-2">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Edit{isApprover && " and review"}
              </NavLink>
            </li>
            {hqStaff && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/publish">
                    Publish
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/export">
                    Export
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </header>
      <div className="my-3">
        <Outlet />
      </div>
    </div>
  );
}
