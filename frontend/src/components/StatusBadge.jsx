import classNames from "classnames";
import PropTypes from "prop-types";

export default function StatusBadge({ status }) {
  let colorClass = "text-bg-dark";
  let label = status;

  // Don't render anything if the status is null
  if (!status) {
    return null;
  }

  // Map status code to color class and display label
  const statusMap = new Map([
    ["on API", { cssClass: "text-bg-primary", displayText: "on API" }],
    ["approved", { cssClass: "text-bg-success", displayText: "Approved" }],
    ["requested", { cssClass: "text-bg-warning", displayText: "Requested" }],
  ]);

  if (statusMap.has(status)) {
    const { cssClass, displayText } = statusMap.get(status);

    colorClass = cssClass;
    label = displayText;
  }

  const classes = classNames(["badge", "rounded-pill", colorClass]);

  return <span className={classes}>{label}</span>;
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};
