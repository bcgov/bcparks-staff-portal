import { Link } from "react-router-dom";
import classNames from "classnames";
import PropTypes from "prop-types";
import "./TouchMenu.scss";

const navItems = [
  {
    label: "Advisories",
    Tag: "a",
    href: "/advisories",
  },
  {
    label: "Park Access Status",
    Tag: "a",
    href: "/park-access-status",
  },
  {
    label: "Activities & Facilities",
    Tag: "a",
    href: "/activities-and-facilities",
  },
  {
    label: "Dates of Operation",
    Tag: Link,
    to: "/",
    // This menu only displays on DOOT right now,
    // so Dates of Operation is always the active item.
    active: true,
  },
];

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

  return (
    <div
      className={classNames("navbar-collapse collapse d-lg-none", {
        show,
      })}
      id="touch-menu"
    >
      <ul className="navbar-nav">
        {navItems.map(({ Tag, label, active, ...itemProps }) => (
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
