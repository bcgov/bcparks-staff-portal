import { useMemo, useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import "./MainLayout.scss";
import useAccess from "@/hooks/useAccess";
import { useApiGet } from "@/hooks/useApi";
import NavSidebar from "@/components/NavSidebar.jsx";
import TouchMenu from "@/components/TouchMenu";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import HeaderTitle from "@/components/HeaderTitle";
import Footer from "@/components/Footer";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import UserContext from "@/contexts/UserContext";
import useFlashMessage from "@/hooks/useFlashMessage";
import { Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fa-kit/icons/classic/regular";

export default function MainLayout() {
  const { isAuthenticated } = useAccess();
  const globalFlashMessage = useFlashMessage();

  // Fetch the user name to display in the header
  // @TODO: Fetch this in a hook, only if the user is authenticated
  const userDetails = useApiGet("/user");

  // Check if the app is running in production
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname === "staff.bcparks.ca";

  // Show or hide the touch menu
  const [showTouchMenu, setShowTouchMenu] = useState(false);

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

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [globalFlashMessage]);

  return (
    <FlashMessageContext.Provider value={flashMessageContextValue}>
      <UserContext.Provider value={userDetails}>
        <div className="layout main">
          <header className="bcparks-global navbar navbar-dark px-3 d-flex align-items-center container-fluid py-1 bg-primary-nav">
            <HeaderTitle />

            {isAuthenticated && (
              <>
                <div className="user-controls d-none d-lg-flex text-white align-items-center ms-auto">
                  <div className="user-name me-3">{userName}</div>

                  <Link to="/logout" className="btn btn-text text-white">
                    Logout
                  </Link>
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
              </>
            )}
          </header>

          <TouchMenu
            show={showTouchMenu}
            closeMenu={() => setShowTouchMenu(false)}
            userName={userName}
          />

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
                <NavSidebar />
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

          <Footer />
        </div>

        <FlashMessage
          title={globalFlashMessage.title}
          message={globalFlashMessage.message}
          isVisible={globalFlashMessage.isOpen}
          onClose={globalFlashMessage.close}
          variant={globalFlashMessage.variant}
        />
      </UserContext.Provider>
    </FlashMessageContext.Provider>
  );
}
