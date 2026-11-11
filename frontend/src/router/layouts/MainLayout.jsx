import { useMemo, useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import classNames from "classnames";
import { useMediaQuery } from "usehooks-ts";
import "./MainLayout.scss";
import useAccess from "@/hooks/useAccess";
import { useApiGet } from "@/hooks/useApi";
import NavSidebar from "@/components/NavSidebar.jsx";
import { SIDEBAR_MEDIA_QUERY } from "@/components/shared/navItems";
import TouchMenu from "@/components/TouchMenu";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import HeaderTitle from "@/components/HeaderTitle";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import UserContext from "@/contexts/UserContext";
import useFlashMessage from "@/hooks/useFlashMessage";
import { Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fa-kit/icons/classic/regular";

export default function MainLayout() {
  const { isAuthenticated } = useAccess();
  const globalFlashMessage = useFlashMessage();

  // Fetch the user name to display in the header
  const userDetails = useApiGet("/user");

  // Check if the app is running in production
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname === "staff.bcparks.ca";

  // Show or hide the touch menu
  const [showTouchMenu, setShowTouchMenu] = useState(false);

  // Show the side nav if it fits on screen, otherwise use the touch menu
  const showSidebar = useMediaQuery(SIDEBAR_MEDIA_QUERY);

  const userName = useMemo(() => {
    if (!isAuthenticated || userDetails.loading || userDetails.error) return "";

    return userDetails.data.name;
  }, [isAuthenticated, userDetails]);

  const flashMessageContextValue = useMemo(
    () => ({
      open: globalFlashMessage.open,
      close: globalFlashMessage.close,
    }),
    [globalFlashMessage.open, globalFlashMessage.close],
  );

  // Close flash message when a button is clicked
  useEffect(() => {
    function handleClick(e) {
      if (!globalFlashMessage.isOpen) return;

      const isLink = e.target.closest("a");
      const isButton = e.target.closest("button");
      const isFormButton = e.target.closest(".form-btn");
      const isInput = e.target.closest("input");
      const isSelectControl = e.target.closest(".bcgov-select");

      // Don't close if clicking form action buttons (Save/Approve/Submit)
      if (isFormButton) return;

      // Close if clicking any other button, link, input, or select control
      if (isButton || isLink || isInput || isSelectControl) {
        globalFlashMessage.close();
      }
    }

    // Use the capture phase so this runs before the clicked element's own handler.
    // A message opened synchronously by that handler is then not closed by this click.
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [globalFlashMessage]);

  return (
    <FlashMessageContext.Provider value={flashMessageContextValue}>
      <UserContext.Provider value={userDetails}>
        <div
          className={classNames("layout main", {
            "has-sidebar": isAuthenticated && showSidebar,
          })}
        >
          <header className="bcparks-global navbar navbar-dark px-3 d-flex align-items-center container-fluid py-1 bg-primary-nav">
            <HeaderTitle />

            {isAuthenticated && showSidebar && (
              <div className="user-controls d-flex text-white align-items-center ms-auto">
                <div className="user-name me-3">{userName}</div>

                <Link to="/logout" className="btn btn-text text-white">
                  Logout
                </Link>
              </div>
            )}

            {isAuthenticated && !showSidebar && (
              <button
                className="navbar-toggler ms-auto p-2"
                type="button"
                aria-label={showTouchMenu ? "Close menu" : "Open menu"}
                aria-controls="touch-menu"
                aria-expanded={showTouchMenu}
                onClick={() => setShowTouchMenu(!showTouchMenu)}
              >
                {showTouchMenu ? (
                  <FontAwesomeIcon icon={faXmark} className="close-icon" />
                ) : (
                  <span className="navbar-toggler-icon"></span>
                )}
              </button>
            )}
          </header>

          {!showSidebar && (
            <TouchMenu
              show={showTouchMenu}
              closeMenu={() => setShowTouchMenu(false)}
              userName={userName}
            />
          )}

          {!isProduction && (
            <Alert
              variant="danger"
              className="text-center text-white border-0 rounded-0 mb-0"
            >
              <FontAwesomeIcon className="me-2" icon={faCircleExclamation} />
              Testing environment only. Information entered will not appear on
              the live reservation site or on bcparks.ca.
            </Alert>
          )}

          <main className="p-0 d-flex flex-column flex-md-row">
            {/* Authenticated user with roles: show sidebar and main content */}
            {isAuthenticated && (
              <>
                {showSidebar && <NavSidebar />}
                <div className="flex-fill" style={{ overflowX: "auto" }}>
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
        </div>

        <FlashMessage {...globalFlashMessage.props} />
      </UserContext.Provider>
    </FlashMessageContext.Provider>
  );
}
