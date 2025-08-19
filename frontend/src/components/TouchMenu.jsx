import { Link } from "react-router-dom";
import useAccess from "@/hooks/useAccess";
import { ROLES } from "../config/permissions";
import classNames from "classnames";
import PropTypes from "prop-types";
import "./TouchMenu.scss";
import navItems from "./shared/navItems";

export default function TouchMenu({
  show = true,
  closeMenu,
  logOut,
  userName,
}) {
  function onLogoutClick() {
    closeMenu();
    logOut();
  }

  const { hasAnyAccess } = useAccess();

  return (
    <div
      className={classNames("navbar-collapse collapse d-lg-none", {
        show,
      })}
      id="touch-menu"
    >
      <ul className="navbar-nav">
        {navItems
          .filter((item) => hasAnyAccess(item.allowedRoles))
          .map(({ Tag, label, active, ...itemProps }) => (
            <li key={label} className="nav-item">
              {/* Use "a" for external links and Router Link components for internal links */}
              <Tag
                className={classNames("nav-link", {
                  active,
                })}
                {...itemProps}
                onClick={closeMenu}
              >
                {label}
              </Tag>
            </li>
          ))}
        <li className="nav-item">
          {/* Full width logout button with the user's name */}
          <button
            type="button"
            className="btn btn-text w-100 text-start nav-link"
            onClick={onLogoutClick}
          >
            <span className="text-dark">{userName}</span>
            <br />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}

// Prop validation
TouchMenu.propTypes = {
  show: PropTypes.bool,
  closeMenu: PropTypes.func.isRequired,
  logOut: PropTypes.func.isRequired,
  userName: PropTypes.string,
};
