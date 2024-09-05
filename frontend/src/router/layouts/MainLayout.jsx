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

        <main className="container">
          <h1>Router test</h1>

          <nav>
            <ul style={{ listStyle: "none" }}>
              <li>
                <Link to={`/`}>Home page</Link>
              </li>
              <li>
                <Link to={`/foo/A`}>Foo page A</Link>
              </li>
              <li>
                <Link to={`/foo/B`}>Foo page B</Link>
              </li>
              <li>
                <Link to={`/bar`}>Bar page</Link>
              </li>
            </ul>
          </nav>

          <Outlet />
        </main>

        <footer className="bcparks-global container-fluid bg-primary-nav">
          test
        </footer>
      </div>
    </>
  );
}
