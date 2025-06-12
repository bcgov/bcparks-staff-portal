import classNames from "classnames";
import PropTypes from "prop-types";
import "./StatusBadge.scss";

export default function StatusBadge({ status }) {
  let colorClass = "text-bg-dark";
  let label = status;

  // Don't render anything if the status is null
  if (!status) {
    return null;
  }

  // Map status code to color class and display label
  const statusMap = new Map([
    ["published", { cssClass: "text-bg-primary", displayText: "Published" }],
    ["approved", { cssClass: "text-bg-success", displayText: "Approved" }],
    [
      "requested",
      { cssClass: "text-bg-warning", displayText: "Requested by HQ" },
    ],
    [
      "pending review",
      { cssClass: "text-bg-dark", displayText: "Pending HQ review" },
    ],
    [
      "not provided",
      { cssClass: "text-bg-disabled", displayText: "Not provided" },
    ],
  ]);

  if (statusMap.has(status)) {
    const { cssClass, displayText } = statusMap.get(status);

    colorClass = cssClass;
    label = displayText;
  }

  const classes = classNames([
    "badge",
    "rounded-pill",
    "status-badge",
    colorClass,
  ]);

  return <span className={classes}>{label}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};
