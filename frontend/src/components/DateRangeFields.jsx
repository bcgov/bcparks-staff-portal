import { faPlus, faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

export default function DateRangeFields({
  dateRanges,
  hasMultipleDates = true,
}) {
  return (
    <>
      {dateRanges.map((dateRange) => (
        <div key={dateRange.id} className="d-flex">
          <div className="form-group">
            <label className="form-label d-lg-none">Start date</label>
            <div className="input-with-append">
              <DatePicker
                className={classNames({
                  "form-control": true,
                })}
                selected={dateRange?.startDate}
                dateFormat="EEE, MMM d, yyyy"
                showMonthYearDropdown
              />
              <FontAwesomeIcon
                className="append-content"
                icon={faCalendarCheck}
              />
            </div>
          </div>

          <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
            <span>&ndash;</span>
          </div>

          <div className="form-group">
            <label className="form-label d-lg-none">End date</label>
            <div className="input-with-append">
              <DatePicker
                className={classNames({
                  "form-control": true,
                })}
                selected={dateRange?.endDate}
                dateFormat="EEE, MMM d, yyyy"
                showMonthYearDropdown
              />
              <FontAwesomeIcon
                className="append-content"
                icon={faCalendarCheck}
              />
            </div>
          </div>
        </div>
      ))}

      {/* TODO: add fields if the button is clicked */}
      {hasMultipleDates && (
        <button className="btn btn-text text-link">
          <FontAwesomeIcon icon={faPlus} />
          <span className="ms-1">Add more dates</span>
        </button>
      )}

      {/* TODO: CMS-872 - use isDateRangeAnnual */}
      <Form.Check
        type="checkbox"
        id="same-dates-every-year"
        name="sameDatesEveryYear"
        label="Dates are the same every year"
      />
    </>
  );
}

DateRangeFields.propTypes = {
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ).isRequired,
  hasMultipleDates: PropTypes.bool,
};
