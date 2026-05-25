import { useId } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export function CountBadge({
  label,
  documentId,
  title = "",
  tooltipText = "",
}) {
  const tooltipId = useId();
  const ariaLabelText = `Open advisory summary for ${title}`;

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id={tooltipId}>{tooltipText}</Tooltip>}
    >
      <Link to={`/advisory-summary/${documentId}`} aria-label={ariaLabelText}>
        <Badge pill bg="light" text="dark" className="count-badge border ms-2">
          {label}
        </Badge>
      </Link>
    </OverlayTrigger>
  );
}

CountBadge.propTypes = {
  label: PropTypes.string.isRequired,
  documentId: PropTypes.string.isRequired,
  title: PropTypes.string,
  tooltipText: PropTypes.string,
};
