import { Link } from "react-router-dom";
import classNames from "classnames";
import useAccess from "@/hooks/useAccess";
import navItems from "./shared/navItems";
import "./NavSidebar.scss";

export default function NavSidebar() {
  const { hasAnyRole } = useAccess();

  return (
    <aside id="portal-nav-sidebar" className="collapse d-lg-block">
      <ul className="nav flex-column mb-auto">
        {navItems
          .filter((item) => hasAnyRole(item.allowedRoles))
          // eslint-disable-next-line no-unused-vars -- allowedRoles is intentionally destructured to avoid passing it to DOM elements
          .map(({ Tag, label, active, allowedRoles, ...itemProps }) => (
            <li key={label} className="nav-item">
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
