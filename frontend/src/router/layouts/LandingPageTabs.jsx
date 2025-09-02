import { useMemo } from "react";
import { Outlet, NavLink } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import "./LandingPageTabs.scss";

export default function LandingPageTabs() {
  const { ROLES, checkAccess, isAuthenticated } = useAccess();

  // Check if the user has permission to approve the season
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  // This prevents flashing the tabs layout to unauthenticated users
  if (!isAuthenticated) return <></>;

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
            {/* Hidden temporarily until the Publish and Export pages are re-implemented */}
            {/* {approver && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/publish">
                  Publish
                </NavLink>
              </li>
            )} */}
            {approver && (
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
