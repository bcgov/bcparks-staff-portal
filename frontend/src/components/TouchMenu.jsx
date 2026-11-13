import useAccess from "@/hooks/useAccess";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fa-kit/icons/classic/regular";
import "./TouchMenu.scss";
import navItems, { quickLinks } from "./shared/navItems";

export default function TouchMenu({ show = true, closeMenu, userName }) {
  const { hasAnyRole, isParkOperator } = useAccess();

  if (!show) return null;

  return (
    <>
      <div id="touch-menu">
        <ul className="navbar-nav">
          {navItems
            .filter((item) =>
              hasAnyRole(item.allowedRoles) &&
              !(item.excludeParkOperators && isParkOperator),)
            // eslint-disable-next-line no-unused-vars -- allowedRoles is intentionally destructured to avoid passing it to DOM elements
            .map(({ Tag, label, icon, allowedRoles, excludeParkOperators, ...itemProps }) => (
              <li key={label} className="nav-item">
                <Tag className="nav-link" onClick={closeMenu} {...itemProps}>
                  <FontAwesomeIcon icon={icon} className="nav-icon" />
                  {label}
                </Tag>
              </li>
            ))}
        </ul>

        <div className="quick-links-heading">
          Quick links
          <FontAwesomeIcon icon={faUpRightFromSquare} />
        </div>

        <ul className="navbar-nav" aria-label="Quick links">
          {quickLinks.map(({ label, icon, href, external }) => (
            <li key={label} className="nav-item">
              <a
                className="nav-link"
                href={href}
                onClick={closeMenu}
                {...(external && { target: "_blank", rel: "noreferrer" })}
              >
                <FontAwesomeIcon icon={icon} className="nav-icon" />
                {label}
                {external && (
                  <FontAwesomeIcon
                    icon={faUpRightFromSquare}
                    className="external-icon"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="user-controls">
          <div className="text-black">{userName}</div>
          <NavLink to="/logout" onClick={closeMenu}>
            Logout
          </NavLink>
        </div>
      </div>

      {/* Dim the page below the menu; click to close */}
      <div className="touch-menu-backdrop" onClick={closeMenu}></div>
    </>
  );
}

// Prop validation
TouchMenu.propTypes = {
  show: PropTypes.bool,
  closeMenu: PropTypes.func.isRequired,
  userName: PropTypes.string,
};
