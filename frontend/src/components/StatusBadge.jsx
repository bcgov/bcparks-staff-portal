import classNames from "classnames";
import PropTypes from "prop-types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as STATUS from "@/constants/seasonStatus.js";
import { ACT_STATUS_MAP } from "@/constants/advisoryStatus";
import "./StatusBadge.scss";

// Map status code to color class and display label
const DOOT_STATUS_MAP = new Map([
  // Dates of Operation Tool season statuses
  [
    STATUS.PUBLISHED.value,
    { cssClass: "text-bg-primary", displayText: STATUS.PUBLISHED.label },
  ],
  [
    STATUS.APPROVED.value,
    { cssClass: "text-bg-success", displayText: STATUS.APPROVED.label },
  ],
  [
    STATUS.REQUESTED.value,
    { cssClass: "text-bg-warning", displayText: STATUS.REQUESTED.label },
  ],
  [
    STATUS.PENDING_REVIEW.value,
    { cssClass: "text-bg-dark", displayText: STATUS.PENDING_REVIEW.label },
  ],
  [
    STATUS.NOT_PROVIDED.value,
    { cssClass: "text-bg-disabled", displayText: STATUS.NOT_PROVIDED.label },
  ],
]);

const STATUS_CONFIG_MAP = new Map([...DOOT_STATUS_MAP, ...ACT_STATUS_MAP]);

export default function StatusBadge({
  status,
  label = null,
  approver = false,
  className = "",
}) {
  let colorClass = "text-bg-dark";
  let badgeLabel = label ?? status;

  // Don't render anything if the status is null
  if (!status) {
    return null;
  }

  const statusConfig = STATUS_CONFIG_MAP.get(status);

  if (statusConfig) {
    const { cssClass, displayText } = statusConfig;

    colorClass = cssClass;
    badgeLabel = label ?? displayText;
  }

  // ACT advisory/closure status icon for approvers
  let icon = null;

  if (approver && statusConfig?.icon) {
    icon = (
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id={`status-tooltip-${status}`}>{badgeLabel}</Tooltip>
        }
      >
        <FontAwesomeIcon icon={statusConfig.icon} />
      </OverlayTrigger>
    );
  }

  const classes = classNames([
    "badge",
    "rounded-pill",
    "status-badge",
    colorClass,
    className,
  ]);

  // For ACT, show icon for approvers, otherwise show badge label
  // For DOOT, show badge label for all users
  return (
    <span className={classes}>{approver && icon ? icon : badgeLabel}</span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
  approver: PropTypes.bool,
  className: PropTypes.string,
};
