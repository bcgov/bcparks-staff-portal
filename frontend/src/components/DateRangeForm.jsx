// Copied from /pages/SubmitDates.jsx
// TODO: change it to be a shared component

import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faHexagonExclamation,
  faXmark,
} from "@fa-kit/icons/classic/regular";
import { normalizeToLocalDate, normalizeToUTCDate } from "@/lib/utils";

function DateRangeForm({
  index,
  dateRange,
  season,
  errors,
  updateDateRange,
  removeDateRange,
}) {
  const dateRangeId = `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`;
  const startDateId = `start-date-${dateRangeId}`;
  const endDateId = `end-date-${dateRangeId}`;

  // Track validation errors for the whole range, or the whole dateable feature
  const groupErrors = errors[dateRangeId] || errors[dateRange.dateableId];
  const startErrors = errors[startDateId] || groupErrors;
  const endErrors = errors[endDateId] || groupErrors;

  // Limit the date range to the operating year
  const minDate = new Date(season.operatingYear, 0, 1);
  const maxDate = new Date(season.operatingYear, 11, 31);

  // Keep local state until the field is blurred or Enter is pressed
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const adjustedLocalStartDate = useMemo(
    () => normalizeToLocalDate(localDateRange.startDate),
    [localDateRange.startDate],
  );
  const adjustedLocalEndDate = useMemo(
    () => normalizeToLocalDate(localDateRange.endDate),
    [localDateRange.endDate],
  );

  // Updates the local date ranges to control the DatePickers
  function onDateChange(dateField, dateObj) {
    // Store as UTC time
    const utcDateObj = normalizeToUTCDate(dateObj);

    const updatedRange = {
      ...localDateRange,
      [dateField]: utcDateObj ?? null,
    };

    setLocalDateRange(updatedRange);
  }

  // Open the calendar to Jan 1 of the operating year if no date is set
  const openDateStart = adjustedLocalStartDate || minDate;
  const openDateEnd = adjustedLocalEndDate || minDate;

  /**
   * Calls updateDateRange with a new date value.
   * @param {string} dateField "startDate" or "endDate"
   * @param {Date} date new date value
   * @returns {void}
   */
  function onSelect(dateField, date) {
    updateDateRange(
      dateRange.dateableId,
      dateRange.dateType.name,
      index,
      dateField,
      date,
    );
  }

  return (
    <div className="row gx-0 dates-row">
      <div className="col-lg-5">
        <div className="form-group mb-3 mb-lg-0">
          <label htmlFor={startDateId} className="form-label d-lg-none">
            Start date
          </label>

          <div className="input-with-append">
            <DatePicker
              id={startDateId}
              className={classNames({
                "form-control": true,
                "is-invalid": startErrors,
              })}
              minDate={minDate}
              maxDate={maxDate}
              openToDate={openDateStart}
              selected={adjustedLocalStartDate}
              onChange={(date) => onDateChange("startDate", date)}
              onBlur={() => {
                // Update the `dates` object on blur
                onSelect("startDate", adjustedLocalStartDate);
              }}
              onKeyDown={(event) => {
                // Update the `dates` object on Enter
                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                  onSelect("startDate", adjustedLocalStartDate);
                }
              }}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />

            {/* Show the calendar icon unless the error icon is showing */}
            <FontAwesomeIcon
              className={classNames("append-content", {
                "text-danger": startErrors,
              })}
              icon={startErrors ? faHexagonExclamation : faCalendarCheck}
            />
          </div>

          {/* Show validation errors for the startDate field */}
          {errors[startDateId] && (
            <div className="error-message mt-2">
              <FontAwesomeIcon icon={faHexagonExclamation} />
              <div>{errors[startDateId]}</div>
            </div>
          )}
        </div>
      </div>

      <div className="date-range-dash d-none d-lg-flex justify-content-center col-lg-auto px-lg-2 text-center">
        <span>&ndash;</span>
      </div>

      <div className="col-lg-5">
        <div className="form-group">
          <label htmlFor={endDateId} className="form-label d-lg-none">
            End date
          </label>

          <div className="input-with-append">
            <DatePicker
              id={endDateId}
              className={classNames({
                "form-control": true,
                "is-invalid": endErrors,
              })}
              minDate={minDate}
              maxDate={maxDate}
              openToDate={openDateEnd}
              selected={adjustedLocalEndDate}
              onChange={(date) => onDateChange("endDate", date)}
              onBlur={() => {
                // Update the `dates` object on blur
                onSelect("endDate", adjustedLocalEndDate);
              }}
              onKeyDown={(event) => {
                // Update the `dates` object on Enter
                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                  onSelect("endDate", adjustedLocalEndDate);
                }
              }}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />

            {/* Show the calendar icon unless the error icon is showing */}
            <FontAwesomeIcon
              className={classNames("append-content", {
                "text-danger": endErrors,
              })}
              icon={endErrors ? faHexagonExclamation : faCalendarCheck}
            />
          </div>

          {/* Show validation errors for the endDate field */}
          {errors[endDateId] && (
            <div className="error-message mt-2">
              <FontAwesomeIcon icon={faHexagonExclamation} />
              <div>{errors[endDateId]}</div>
            </div>
          )}
        </div>
      </div>

      <div className="date-range-remove col-lg-1 order-last order-lg-0">
        {index > 0 && (
          <button
            className="btn btn-text text-link"
            onClick={() =>
              removeDateRange(
                dateRange.dateType.name,
                dateRange.dateableId,
                index,
                dateRange.id,
              )
            }
          >
            <FontAwesomeIcon icon={faXmark} />
            <span className="ms-1 d-inline d-lg-none">
              Remove this date range
            </span>
          </button>
        )}
      </div>

      {/* Show validation errors for the date range */}
      {errors[dateRangeId] && (
        <div className="error-message mt-2">
          <FontAwesomeIcon icon={faHexagonExclamation} />
          <div>{errors[dateRangeId]}</div>
        </div>
      )}
    </div>
  );
}

DateRangeForm.propTypes = {
  dateRange: PropTypes.shape({
    id: PropTypes.number,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    dateableId: PropTypes.number,
    dateType: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
    }),
  }),
  index: PropTypes.number,
  season: PropTypes.shape({
    operatingYear: PropTypes.number,
  }),
  errors: PropTypes.object,
  updateDateRange: PropTypes.func,
  removeDateRange: PropTypes.func,
};

export default DateRangeForm;
