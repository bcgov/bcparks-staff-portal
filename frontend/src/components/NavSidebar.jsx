import { Link } from "react-router-dom";
import classNames from "classnames";
import "./NavSidebar.scss";

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

export default function NavSidebar() {
  return (
    <aside id="portal-nav-sidebar" className="collapse d-lg-block">
      <ul className="nav flex-column mb-auto">
        {navItems.map(({ Tag, label, active, ...itemProps }) => (
          <li key={label} className="nav-item">
            {/* Use "a" for external links and Router Link components for internal links */}
            <Tag
              className={classNames("nav-link text-truncate", {
                active,
              })}
              {...itemProps}
            >
              {label}
            </Tag>
          </li>
        ))}
      </ul>
    </aside>
  );
}
