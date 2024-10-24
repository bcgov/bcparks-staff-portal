import { Outlet, Link } from "react-router-dom";
import "./MainLayout.scss";
import bcParksLogo from "../../assets/bc-parks-logo.svg";
import bcParksWordmark from "../../assets/bc-parks-wordmark.svg";

export default function MainLayout() {
  return (
    <>
      <div className="layout main">
        <header className="bcparks-global d-flex align-items-center container-fluid py-1 bg-primary-nav">
          <Link to={`/`} className="d-inline-block" href="/">
            <img
              className="d-block d-md-none"
              src={bcParksWordmark}
              height="60"
              alt="BC Parks logo"
            />
            {/* swap logo images on larger screens */}
            <img
              className="d-none d-md-block"
              src={bcParksLogo}
              height="100"
              alt="BC Parks logo"
            />
          </Link>
        </header>

        <main className="container mb-5">
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
    </>
  );
}
