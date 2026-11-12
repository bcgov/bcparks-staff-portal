import classNames from "classnames";
import useAccess from "@/hooks/useAccess";
import navItems from "./shared/navItems";
import "./NavSidebar.scss";

export default function NavSidebar() {
  const { hasAnyRole, isParkOperator } = useAccess();

  return (
    <aside id="portal-nav-sidebar" className="collapse d-lg-block">
      <ul className="nav flex-column mb-auto">
        {navItems
          .filter(
            (item) =>
              hasAnyRole(item.allowedRoles) &&
              !(item.excludeParkOperators && isParkOperator),
          )
          .map(
            ({
              Tag,
              label,
              active,
              /* eslint-disable no-unused-vars -- intentionally destructured to avoid passing them to DOM elements */
              allowedRoles,
              excludeParkOperators,
              /* eslint-enable no-unused-vars -- end of non-DOM props */
              ...itemProps
            }) => (
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
            ),
          )}
      </ul>
    </aside>
  );
}
