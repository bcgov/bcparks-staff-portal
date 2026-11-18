import PropTypes from "prop-types";
import classNames from "classnames";
import { InlineAlert as BcInlineAlert } from "@bcgov/design-system-react-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fa-kit/icons/classic/regular";
import "./InlineAlert.scss";

/**
 * BC Gov inline alert with an optional link on its own line below the description.
 * External links open in a new tab and show an external-link icon.
 * @param {Object} props Component props
 * @param {string} [props.variant] Alert variant: "info", "success", "warning" or "danger"
 * @param {string} props.title Bold heading text
 * @param {React.ReactNode} [props.description] Body text
 * @param {Object} [props.link] Optional link: { href, label, isExternal }
 * @param {string} [props.className] Extra classes for the alert wrapper
 * @returns {JSX.Element} The inline alert
 */
export function InlineAlert({
  variant = "info",
  title,
  description,
  link,
  className = "",
}) {
  const isExternal = link?.isExternal ?? true;

  return (
    <BcInlineAlert
      variant={variant}
      title={title}
      description={
        (description || link) && (
          <>
            {description}
            {description && link && <br />}
            {link && (
              <a
                href={link.href}
                {...(isExternal && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
              >
                {link.label}
                {isExternal && (
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className="ms-1"
                  />
                )}
              </a>
            )}
          </>
        )
      }
      // BC Gov spreads props after its own className, so keep its classes
      className={classNames(
        "bcds-Inline-Alert",
        variant,
        "inline-alert",
        className,
      )}
    />
  );
}

InlineAlert.propTypes = {
  variant: PropTypes.oneOf(["info", "success", "warning", "danger"]),
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  link: PropTypes.shape({
    href: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    isExternal: PropTypes.bool,
  }),
  className: PropTypes.string,
};
