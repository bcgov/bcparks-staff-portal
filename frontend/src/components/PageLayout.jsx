import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import classNames from "classnames";
import "./PageLayout.scss";

/**
 * Shared landing page layout: a header with the page title and optional tab navigation,
 * followed by the page content.
 * @param {Object} props Component props
 * @param {string} props.title Page title, displayed in the h1
 * @param {Array<{label: string, to: string, end?: boolean}>} [props.tabs] Tab links the user can access.
 * The tabs are only displayed when there is more than one.
 * @param {string} [props.className] Extra classes for the layout wrapper
 * @param {React.ReactNode} props.children Page content
 * @returns {JSX.Element} The page layout
 */
export default function PageLayout({ title, tabs = [], className, children }) {
  // Hide the tabs when the user only has access to one
  const showTabs = tabs.length > 1;

  return (
    <div className={classNames("layout page-layout", className)}>
      <header className="section-tabs d-flex flex-column">
        <div className="container-fluid">
          <h1 className="my-4">{title}</h1>

          {showTabs && (
            <ul className="nav nav-tabs">
              {tabs.map((tab) => (
                <li key={tab.to} className="nav-item">
                  <NavLink className="nav-link" to={tab.to} end={tab.end}>
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <div className="flex-fill my-3">{children}</div>
    </div>
  );
}

PageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      end: PropTypes.bool,
    }),
  ),
  className: PropTypes.string,
  children: PropTypes.node,
};
