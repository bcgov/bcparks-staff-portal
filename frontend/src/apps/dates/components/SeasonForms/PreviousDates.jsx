import PropTypes from "prop-types";

import { formatPreviousDateRange } from "@/lib/utils";

export default function PreviousDates({ label = "Previous", dateRanges = [] }) {
  if (!dateRanges.length) {
    return <p>Previous dates are not provided</p>;
  }

  return (
    <div className="previous-dates d-flex">
      <div className="label me-2">{label}:</div>
      <div className="dates">
        <ul className="list-unstyled">
          {dateRanges.map((range) => (
            <li key={range.id}>{formatPreviousDateRange(range)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Prop types
PreviousDates.propTypes = {
  label: PropTypes.string,
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ),
};
