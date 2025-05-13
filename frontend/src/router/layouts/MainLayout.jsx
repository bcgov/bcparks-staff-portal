import { useMemo, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import "./MainLayout.scss";
import logo from "@/assets/bc-parks-logo.svg";
import logoVertical from "@/assets/bc-parks-logo-vertical.svg";
import useAccess from "@/hooks/useAccess";
import { useApiGet } from "@/hooks/useApi";
import NavSidebar from "@/components/NavSidebar.jsx";
import TouchMenu from "@/components/TouchMenu";

export default function MainLayout() {
  const { logOut } = useAccess();

  // Fetch the user name to display in the header
  const userDetails = useApiGet("/user");

  // Show or hide the touch menu
  const [showTouchMenu, setShowTouchMenu] = useState(false);

  const userName = useMemo(() => {
    if (userDetails.loading || userDetails.error) return "";

    return userDetails.data.name;
  }, [userDetails]);

  return (
    <div className="layout main">
      <header className="bcparks-global navbar navbar-dark px-3 d-flex align-items-center container-fluid py-1 bg-primary-nav">
        <Link
          to={`/`}
          className="d-inline-block d-flex align-items-center align-items-md-end logo-link"
          href="/"
        >
          <img
            className="d-block d-md-none"
            src={logoVertical}
            height="60"
            alt="BC Parks logo"
          />
          {/* swap logo images on larger screens */}
          <img
            className="d-none d-md-block"
            src={logo}
            height="60"
            alt="BC Parks logo"
          />

          <div className="app-title text-white mx-3 mx-md-1">
            Staff web portal
          </div>
        </Link>

        <div className="user-controls d-none d-lg-flex text-white align-items-center ms-auto">
          <div className="user-name me-3">{userName}</div>

          <button
            type="button"
            onClick={logOut}
            className="btn btn-text text-white"
          >
            Logout
          </button>
        </div>

        <button
          className="navbar-toggler d-block d-lg-none"
          type="button"
          data-toggle="collapse"
          data-target="#touch-menu"
          onClick={() => setShowTouchMenu(!showTouchMenu)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
      </header>

      <TouchMenu
        show={showTouchMenu}
        closeMenu={() => setShowTouchMenu(false)}
        logOut={logOut}
        userName={userName}
      />

      <main className="p-0 d-flex flex-column flex-md-row">
        <NavSidebar />

        <div className="flex-fill">
          <Outlet />
        </div>
      </main>

      <footer className="bcparks-global py-2 py-md-0 d-flex justify-content-md-end align-items-center container-fluid text-bg-primary-nav">
        <div className="quick-links d-flex flex-column flex-md-row me-md-4">
          <span>Quick links:</span>

          <a href="https://attendance-revenue.bcparks.ca/">
            Attendance and Revenue
          </a>

          <a href="https://reserve-admin.bcparks.ca/dayuse/">
            Day-use Pass admin
          </a>

          <a href="mailto:parksweb@gov.bc.ca">Contact us</a>
        </div>
      </footer>
    </div>
  );
}
