import PropTypes from "prop-types";
import { formatDateShort, formatDateShortWithYear } from "@/lib/utils";

import "./DateRange.scss";

// Displays a date range in a table cell
export default function DateRange({ start, end, formatWithYear = false }) {
  if (!start || !end) {
    return "Not submitted";
  }

  const formatFunction = formatWithYear
    ? formatDateShortWithYear
    : formatDateShort;

  const startDate = formatFunction(start);

  const endDate = formatFunction(end);

  return (
    <div className="date-range">
      <span className="date">{startDate}</span>
      <span className="separator">–</span>
      <span className="date">{endDate}</span>
    </div>
  );
}

DateRange.propTypes = {
  start: PropTypes.string,
  end: PropTypes.string,
  formatWithYear: PropTypes.bool,
};
