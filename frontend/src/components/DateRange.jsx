import PropTypes from "prop-types";
import { formatDateShort } from "@/lib/utils";

import "./DateRange.scss";

// Displays a date range in a table cell
export default function DateRange({ start, end }) {
  if (!start || !end) {
    return "Not submitted";
  }

  const startDate = formatDateShort(start);

  const endDate = formatDateShort(end);

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
};
