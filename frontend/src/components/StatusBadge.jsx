import classNames from "classnames";
import PropTypes from "prop-types";
import * as STATUS from "@/constants/seasonStatus.js";
import "./StatusBadge.scss";

export default function StatusBadge({ status, label, className }) {
  let colorClass = "text-bg-dark";
  let badgeLabel = label ?? status;

  // Don't render anything if the status is null
  if (!status) {
    return null;
  }

  // Map status code to color class and display label
  const statusMap = new Map([
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

  if (statusMap.has(status)) {
    const { cssClass, displayText } = statusMap.get(status);

    colorClass = cssClass;
    badgeLabel = label ?? displayText;
  }

  const classes = classNames([
    "badge",
    "rounded-pill",
    "status-badge",
    colorClass,
    className,
  ]);

  return <span className={classes}>{badgeLabel}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
};

StatusBadge.defaultProps = {
  label: null,
  className: "",
};
