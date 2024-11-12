import PropTypes from "prop-types";
import useDate from "../hooks/useDate";
import { useMemo } from "react";

import "./DateRange.scss";

// Displays a date range in a table cell
export default function DateRange({ start, end }) {
  const { formatted: startFormatted, FORMAT_SHORT } = useDate(start);
  const startDate = useMemo(
    () => startFormatted(FORMAT_SHORT),
    [startFormatted, FORMAT_SHORT],
  );

  const { formatted: endFormatted } = useDate(end);
  const endDate = useMemo(
    () => endFormatted(FORMAT_SHORT),
    [endFormatted, FORMAT_SHORT],
  );

  return (
    <div className="date-range">
      <span className="date">{startDate}</span>
      <span className="separator">–</span>
      <span className="date">{endDate}</span>
    </div>
  );
}

DateRange.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
};
