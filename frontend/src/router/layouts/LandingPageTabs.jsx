import { useMemo, useContext } from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import "./LandingPageTabs.scss";
import UserContext from "@/contexts/UserContext";
import { NoParkAccess } from "../../components/NoParkAccess";

export default function LandingPageTabs() {
  const { ROLES, checkAccess, hasAnyAccess, isAuthenticated } = useAccess();

  const { data: userData } = useContext(UserContext);

  // Check if the user has permission to approve the season
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );
  // Check if the user has permission to access export page
  const userExportPermission = useMemo(
    () => hasAnyAccess([ROLES.APPROVER, ROLES.ALL_PARK_ACCESS]),
    [hasAnyAccess, ROLES.APPROVER, ROLES.ALL_PARK_ACCESS],
  );

  // Check if the user has access to all parks
  const allParkAccess = useMemo(
    () => checkAccess(ROLES.ALL_PARK_ACCESS),
    [checkAccess, ROLES.ALL_PARK_ACCESS],
  );

  // This prevents flashing the tabs layout to unauthenticated users
  if (!isAuthenticated) return <></>;

  // If this user has no access to any parks, show "Access Pending"
  if (!allParkAccess && userData?.accessGroups?.length === 0) {
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
                Edit{approver && " and review"}
              </NavLink>
            </li>
            {/* Hidden temporarily until the Publish page is re-implemented */}
            {/* {approver && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/publish">
                  Publish
                </NavLink>
              </li>
            )} */}
            {userExportPermission && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/export">
                  Export
                </NavLink>
              </li>
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
