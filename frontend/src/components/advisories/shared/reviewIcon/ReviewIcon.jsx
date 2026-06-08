import PropTypes from "prop-types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { REVIEW_STATUS } from "@/constants/reviewStatus";
import "./ReviewIcon.scss";

export function ReviewIcon({ reviewStatus, rowId, icon }) {
  const statusSlug = reviewStatus.toLowerCase();
  const statusClassName = `review-status--${statusSlug}`;
  const tooltipId = `review-status--${statusSlug}-${rowId}`;
  // For "Ended" and "Expiring" statuses, the tooltip shows "Warning"
  // For "Unpublished" status, the tooltip shows "Updated" instead of "Unpublished"
  let statusText = reviewStatus;

  if ([REVIEW_STATUS.ENDED, REVIEW_STATUS.EXPIRING].includes(reviewStatus)) {
    statusText = "Warning";
  } else if (reviewStatus === REVIEW_STATUS.UNPUBLISHED) {
    statusText = "Updated";
  }

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={<Tooltip id={tooltipId}>{statusText}</Tooltip>}
    >
      <span className={statusClassName} aria-label={statusText}>
        <FontAwesomeIcon icon={icon} />
      </span>
    </OverlayTrigger>
  );
}

ReviewIcon.propTypes = {
  reviewStatus: PropTypes.string.isRequired,
  rowId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
};
