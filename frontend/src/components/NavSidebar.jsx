import { useId, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { useLocalStorage } from "usehooks-ts";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faUpRightFromSquare,
} from "@fa-kit/icons/classic/regular";
import useAccess from "@/hooks/useAccess";
import navItems, { quickLinks } from "./shared/navItems";
import "./NavSidebar.scss";

/**
 * Shows a tooltip to the right of the child element on hover or focus.
 * @param {Object} props Component props
 * @param {string} props.label Tooltip text
 * @param {boolean} [props.show=true] Whether to show the tooltip at all
 * @param {React.ReactElement} props.children Element that triggers the tooltip; must accept a ref
 * @returns {React.ReactElement} The child element, wrapped in a tooltip trigger when shown
 */
function NavTooltip({ label, show = true, children }) {
  const id = useId();

  if (!show) return children;

  return (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip id={id}>{label}</Tooltip>}
    >
      {children}
    </OverlayTrigger>
  );
}

NavTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  show: PropTypes.bool,
  children: PropTypes.element.isRequired,
};

/**
 * Sizes an element to fill the viewport below its current top edge, so it
 * fits on screen at any scroll position (e.g. below the test environment banner).
 * @returns {React.RefObject<HTMLElement>} Ref to attach to the element
 */
function useFillViewportHeight() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    let frame = null;

    function updateHeight() {
      frame = null;
      const element = ref.current;

      if (!element) return;

      const top = Math.max(element.getBoundingClientRect().top, 0);

      element.style.height = `${window.innerHeight - top}px`;
    }

    function scheduleUpdate() {
      if (frame === null) frame = requestAnimationFrame(updateHeight);
    }

    updateHeight();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

export default function NavSidebar() {
  const { hasAnyRole, isParkOperator } = useAccess();
  const [collapsed, setCollapsed] = useLocalStorage(
    "navSidebarCollapsed",
    false,
  );
  const contentRef = useFillViewportHeight();

  const toggleLabel = collapsed ? "Expand menu" : "Collapse menu";

  return (
    <aside id="portal-nav-sidebar" className={classNames({ collapsed })}>
      <nav ref={contentRef} className="sidebar-content" aria-label="Main menu">
        <ul className="nav flex-column">
          {navItems
            .filter((item) =>
              hasAnyRole(item.allowedRoles) &&
              !(item.excludeParkOperators && isParkOperator),)
            // eslint-disable-next-line no-unused-vars -- allowedRoles is intentionally destructured to avoid passing it to DOM elements
            .map(({ Tag, label, icon, allowedRoles,  excludeParkOperators, ...itemProps }) => (
              <li key={label} className="nav-item">
                <NavTooltip label={label} show={collapsed}>
                  <Tag className="nav-link" {...itemProps}>
                    <FontAwesomeIcon icon={icon} className="nav-icon" />
                    <span
                      className={classNames({ "visually-hidden": collapsed })}
                    >
                      {label}
                    </span>
                  </Tag>
                </NavTooltip>
              </li>
            ))}
        </ul>

        <div className="quick-links mt-auto">
          {collapsed ? (
            <hr className="quick-links-divider" />
          ) : (
            <div className="quick-links-heading">
              Quick links
              <FontAwesomeIcon icon={faUpRightFromSquare} />
            </div>
          )}

          <ul className="nav flex-column" aria-label="Quick links">
            {quickLinks.map(({ label, icon, href, external }) => (
              <li key={label} className="nav-item">
                <NavTooltip label={label} show={collapsed}>
                  <a
                    className="nav-link"
                    href={href}
                    {...(external && { target: "_blank", rel: "noreferrer" })}
                  >
                    <FontAwesomeIcon icon={icon} className="nav-icon" />
                    <span
                      className={classNames({ "visually-hidden": collapsed })}
                    >
                      {label}
                    </span>
                  </a>
                </NavTooltip>
              </li>
            ))}
          </ul>
        </div>

        <div className="collapse-toggle">
          <NavTooltip label={toggleLabel}>
            <button
              type="button"
              className="btn btn-link"
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              <FontAwesomeIcon
                icon={collapsed ? faAnglesRight : faAnglesLeft}
              />
            </button>
          </NavTooltip>
        </div>
      </nav>
    </aside>
  );
}
