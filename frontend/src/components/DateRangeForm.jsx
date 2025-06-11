// Copied from /pages/SubmitDates.jsx
// TODO: change it to be a shared component

import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { formatDateRangeText } from "@/lib/utils";

// Components
function DateRangeFields({}) {
  return (
    <div className="d-flex mb-3">
      <div className="form-group">
        <label className="form-label d-lg-none">
          Start date
        </label>
        <div className="input-with-append">
          <DatePicker
            className={classNames({
              "form-control": true,
            })}
            dateFormat="EEE, MMM d, yyyy"
            showMonthYearDropdown
          />
          <FontAwesomeIcon icon={faCalendarCheck} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label d-lg-none">End date</label>
        <div className="input-with-append">
          <DatePicker
            className={classNames({
              "form-control": true,
            })}
            dateFormat="EEE, MMM d, yyyy"
            showMonthYearDropdown
          />
          <FontAwesomeIcon icon={faCalendarCheck} />
        </div>
      </div>
    </div>
  );
}

function DateRangeForm({
  dateType,
  dateRanges,
  seasons,
  currentYear,
  lastYear,
}) {
  // if there are no date ranges
  if (!dateRanges || Object.keys(dateRanges).length === 0) {
    return (
      <div className="row gx-0">
        <div key={dateType} className="col-lg-6">
          <h6 className="fw-normal">{dateType}</h6>
          <DateRangeFields />
        </div>
      </div>
    );
  }
  return (
    <div className="row gx-0">
      {Object.entries(dateRanges).map(([dateTypeName, dateRange]) => {
        const lastYearRanges = dateRange[lastYear] || [];
        const currentYearRanges = dateRange[currentYear] || [];

        return (
          <div key={dateTypeName} className="col-lg-6">
            <h6 className="fw-normal">{dateTypeName}</h6>
            {lastYearRanges.length > 0 && (
              <div className="d-flex">
                <span className="me-2">Previous:</span>
                {lastYearRanges.map((date) => (
                  <span key={date.id}>
                    {formatDateRangeText(date.startDate, date.endDate)}
                  </span>
                ))}
              </div>
            )}

            {/* TODO: add form for current year */}
            {currentYearRanges.length > 0 && (
              <div className="d-flex">
                <span className="me-2">Current:</span>
                {currentYearRanges.map((date) => (
                  <span key={date.id}>
                    {formatDateRangeText(date.startDate, date.endDate)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

DateRangeForm.propTypes = {
  dateType: PropTypes.string,
  dateRanges: PropTypes.object,
  seasons: PropTypes.object,
  currentYear: PropTypes.number,
  lastYear: PropTypes.number,
};

export default DateRangeForm;
