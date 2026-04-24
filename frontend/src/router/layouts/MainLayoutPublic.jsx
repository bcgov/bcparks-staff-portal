import { useMemo, useEffect } from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.scss";
import FlashMessage from "@/components/FlashMessage";
import HeaderTitle from "@/components/HeaderTitle";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import useFlashMessage from "@/hooks/useFlashMessage";
import { Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fa-kit/icons/classic/regular";

export default function MainLayoutPublic() {
  const globalFlashMessage = useFlashMessage();

  // Check if the app is running in production
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname === "staff.bcparks.ca";

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

      // Don't close if clicking form action buttons (Save/Approve/Submit)
      if (isFormButton) return;

      // Close if clicking any other button, link, or input
      if (isButton || isLink || isInput) {
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
      <div className="layout main">
        <header className="bcparks-global navbar navbar-dark px-3 d-flex align-items-center container-fluid py-1 bg-primary-nav">
          <HeaderTitle />
        </header>

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
          {/* Use the layout with no sidebar for public pages page */}
          <Outlet />
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
