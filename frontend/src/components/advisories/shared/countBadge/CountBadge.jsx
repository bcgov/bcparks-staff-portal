import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Badge from "react-bootstrap/Badge";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

import "./CountBadge.scss";

export function CountBadge({ index, label, documentId, title, tooltipText }) {
  // One advisory can have multiple count badges
  // e.g. "count-badge-tooltip-123abc--0" and "count-badge-tooltip-123abc--1"
  const tooltipId = `count-badge-tooltip-${documentId}-${index}`;
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
  index: PropTypes.number,
  label: PropTypes.string.isRequired,
  documentId: PropTypes.string.isRequired,
  title: PropTypes.string,
  tooltipText: PropTypes.string,
};

CountBadge.defaultProps = {
  index: 0,
  title: "",
  tooltipText: "",
};
