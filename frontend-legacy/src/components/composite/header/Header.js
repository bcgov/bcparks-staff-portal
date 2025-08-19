import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import "./Header.css";
import AccountInfo from "../accountInfo/AccountInfo";
import config from "../../../utils/config";
import ResponsiveDrawer from "../responsiveDrawer/responsiveDrawer";
import InfoIcon from "@material-ui/icons/InfoOutlined";

export const goHome = (e, history) => {
  e.stopPropagation();
  e.preventDefault();

  if (
    history.location &&
    history.location.pathname &&
    history.location.pathname === "/"
  ) {
    return false;
  }

  if (history.location.pathname === "/error") {
    sessionStorage.clear();
    history.push("/");
    return true;
  }

  history.push("/");
  return true;
};

export default function Header({ handleTabChange }) {
  const history = useHistory();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Check if the app is running in production
  const isProduction =
    typeof window !== "undefined" &&
    window.location.hostname === "staff.bcparks.ca";

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container-fluid">
          <div
            className="navbar-brand pointer"
            onClick={(e) => goHome(e, history)}
            role="button"
            onKeyDown={(e) => goHome(e, history)}
            tabIndex={0}
          >
            {windowWidth > 768 ?
              <img
                className="img-fluid"
                src={`${config.REACT_APP_FRONTEND_BASE_URL}/images/bcid-logo-rev-en.svg`}
                width="200"
                alt="BC Parks Logo"
              />
              :
              <img
                className="img-fluid"
                src={`${config.REACT_APP_FRONTEND_BASE_URL}/images/logo-bcparks-rev-vertical.svg`}
                width="65"
                alt="BC Parks Logo"
              />
            }
            <div
              className="pointer navbar-brand nav-item nav-link nav-title"
              onClick={(e) => goHome(e, history)}
              role="button"
              onKeyDown={(e) => goHome(e, history)}
              tabIndex={0}
            >
              Staff web portal
            </div>
          </div>
          {windowWidth > 768 ?
            <AccountInfo />
            :
            <ResponsiveDrawer handleTabChange={handleTabChange} />
          }
        </div>
      </nav>
      {!isProduction && (
        <div
          role="alert"
          className="text-center text-white border-0 rounded-0 mb-0 alert alert-danger show"
        >
          <InfoIcon className="me-1" />
          Testing environment only. Information entered will not appear on the
          live reservation site or on bcparks.ca.
        </div>
      )}
    </header>
  );
}

Header.propTypes = {};
