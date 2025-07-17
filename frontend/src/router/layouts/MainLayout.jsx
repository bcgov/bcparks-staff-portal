import { useMemo, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import "./MainLayout.scss";
import logo from "@/assets/bc-parks-logo.svg";
import logoVertical from "@/assets/bc-parks-logo-vertical.svg";
import useAccess from "@/hooks/useAccess";
import { useApiGet } from "@/hooks/useApi";
import NavSidebar from "@/components/NavSidebar.jsx";
import TouchMenu from "@/components/TouchMenu";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import { Unauthorized } from "@/components/Unauthorized";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import useFlashMessage from "@/hooks/useFlashMessage";
import { Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fa-kit/icons/classic/regular";

export default function MainLayout() {
  const { logOut, roles: jwtRoles, ROLES: dootRoles } = useAccess();
  const globalFlashMessage = useFlashMessage();

  // Returns true if the user has any DOOT role or any legacy staff portal role
  function hasAnyRole() {
    const allStaffPortalRoles = new Set([
      ...["approver", "submitter"],
      ...Object.values(dootRoles),
    ]);

    return jwtRoles.some((role) => allStaffPortalRoles.has(role));
  }

  // Fetch the user name to display in the header
  const userDetails = useApiGet("/user");

  // Check if the app is running in production
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname === "staff.bcparks.ca";

  // Show or hide the touch menu
  const [showTouchMenu, setShowTouchMenu] = useState(false);

  const userName = useMemo(() => {
    if (userDetails.loading || userDetails.error) return "";

    return userDetails.data.name;
  }, [userDetails]);

  const flashMessageContextValue = useMemo(
    () => ({
      open: globalFlashMessage.open,
      close: globalFlashMessage.close,
    }),
    [globalFlashMessage.open, globalFlashMessage.close],
  );

  return (
    <FlashMessageContext.Provider value={flashMessageContextValue}>
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

        {!isProduction && (
          <Alert
            variant="danger"
            className="text-center text-white border-0 rounded-0 mb-0"
          >
            <FontAwesomeIcon className="me-2" icon={faCircleExclamation} />
            Testing environment only. Information entered will not appear on the
            live reservation site or on bcparks.ca.
          </Alert>
        )}

        <main className="p-0 d-flex flex-column flex-md-row">
          {!hasAnyRole() ? (
            <Unauthorized />
          ) : (
            <>
              <NavSidebar />
              <div className="flex-fill">
                {userDetails.loading ? (
                  <div className="container mt-3">
                    <LoadingBar />
                  </div>
                ) : (
                  <Outlet />
                )}
              </div>
            </>
          )}
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

      <FlashMessage
        title={globalFlashMessage.title}
        message={globalFlashMessage.message}
        isVisible={globalFlashMessage.isOpen}
        onClose={globalFlashMessage.close}
      />
    </FlashMessageContext.Provider>
  );
}
