import useAccess from "@/hooks/useAccess";
import classNames from "classnames";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import "./TouchMenu.scss";
import navItems from "./shared/navItems";

export default function TouchMenu({ show = true, closeMenu, userName }) {

  const { hasAnyRole } = useAccess();

  return (
    <div
      className={classNames("navbar-collapse collapse d-lg-none", {
        show,
      })}
      id="touch-menu"
    >
      <ul className="navbar-nav">
        {navItems
          .filter((item) => hasAnyRole(item.allowedRoles))
          // eslint-disable-next-line no-unused-vars -- allowedRoles is intentionally destructured to avoid passing it to DOM elements
          .map(({ Tag, label, allowedRoles, ...itemProps }) => (
            <li key={label} className="nav-item">
              {/* Use "a" for external links and Router Link components for internal links */}
              <Tag className="nav-link" onClick={closeMenu} {...itemProps}>
                {label}
              </Tag>
            </li>
          ))}
        <li className="nav-item">
          {/* Full width logout link with the user's name */}
          <NavLink
            to="/logout"
            className="btn btn-text w-100 text-start nav-link"
            onClick={closeMenu}
          >
            <span className="text-dark">{userName}</span>
            <br />
            Logout
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

// Prop validation
TouchMenu.propTypes = {
  show: PropTypes.bool,
  closeMenu: PropTypes.func.isRequired,
  userName: PropTypes.string,
};
