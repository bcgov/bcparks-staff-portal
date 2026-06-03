import { useMemo, useEffect } from "react";
import { Outlet } from "react-router-dom";
import "./MainLayout.scss";
import FlashMessage from "@/components/FlashMessage";
import HeaderTitle from "@/components/HeaderTitle";
import Footer from "@/components/Footer";
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

        <Footer />
      </div>

      <FlashMessage
        title={globalFlashMessage.title}
        message={globalFlashMessage.message}
        isVisible={globalFlashMessage.isOpen}
        onClose={globalFlashMessage.close}
        variant={globalFlashMessage.variant}
      />
    </FlashMessageContext.Provider>
  );
}
