import { Link } from "react-router-dom";
import classNames from "classnames";
import useAccess from "@/hooks/useAccess";
import navItems from "./shared/navItems";
import "./NavSidebar.scss";

export default function NavSidebar() {
  const { hasAnyAccess } = useAccess();

  return (
    <aside id="portal-nav-sidebar" className="collapse d-lg-block">
      <ul className="nav flex-column mb-auto">
        {navItems
          .filter((item) => hasAnyAccess(item.allowedRoles))
          .map(({ Tag, label, active, ...itemProps }) => (
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
