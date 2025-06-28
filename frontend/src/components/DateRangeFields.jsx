import { useMemo, useState } from "react";
import {
  faPlus,
  faXmark,
  faCalendarCheck,
} from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

import { normalizeToUTCDate, normalizeToLocalDate } from "@/lib/utils";

function DateRange({ dateRange, updateDateRange, removeDateRange }) {
  // A unique ID for template loops and selectors
  const idOrTempId = dateRange.id || dateRange.tempId;

  // Keep local state until the field is blurred or Enter is pressed
  const [localDateRange, setLocalDateRange] = useState({ ...dateRange });
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

  // Convert to UTC if necessary, and call the update method from the parent
  function onSelect(dateField, dateObj) {
    const newValue = normalizeToUTCDate(dateObj);

    // Existing ranges have an ID
    if (dateRange.id) {
      return updateDateRange(dateRange.id, dateField, newValue);
    }

    // New ranges have a tempId
    return updateDateRange(dateRange.tempId, dateField, newValue, true);
  }

  return (
    <div className="d-flex mb-2">
      <div className="form-group">
        <label className="form-label d-lg-none">Start date</label>
        <div className="input-with-append">
          <DatePicker
            id={`date-range-${idOrTempId}-start`}
            className="form-control start-date"
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
            // @TODO: the dropdown makes chrome hang??
            showMonthYearDropdown
          />

          <FontAwesomeIcon className="append-content" icon={faCalendarCheck} />
        </div>
      </div>

      <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
        <span>&ndash;</span>
      </div>

      <div className="form-group">
        <label className="form-label d-lg-none">End date</label>
        <div className="input-with-append">
          <DatePicker
            id={`date-range-${idOrTempId}-end`}
            className="form-control end-date"
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
            // @TODO: the dropdown makes chrome hang??
            showMonthYearDropdown
          />

          <FontAwesomeIcon className="append-content" icon={faCalendarCheck} />
        </div>
      </div>

      <button
        className="btn btn-text text-link align-self-end"
        onClick={() => removeDateRange(dateRange)}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

DateRange.propTypes = {
  dateRange: PropTypes.shape({
    // Existing date ranges have an ID
    id: PropTypes.number,
    // New date ranges have a tempId
    tempId: PropTypes.string,
    // either id or tempId is required

    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }).isRequired,
  updateDateRange: PropTypes.func.isRequired,
  removeDateRange: PropTypes.func.isRequired,
};

export default function DateRangeFields({
  dateRanges,
  updateDateRange,
  removeDateRange,
  addDateRange,
  dateType,
  dateRangeAnnuals,
  updateDateRangeAnnual,
  hasMultipleDates = true,
}) {
  // Functions

  // find the matching dateRangeAnnual for this dateType
  const matchedDateRangeAnnual = useMemo(() => {
    if (!dateType || !dateRangeAnnuals) return null;

    return dateRangeAnnuals.find(
      (dateRangeAnnual) => dateRangeAnnual.dateType?.name === dateType.name,
    );
  }, [dateType, dateRangeAnnuals]);

  const isDateRangeAnnual = matchedDateRangeAnnual?.isDateRangeAnnual ?? false;

  // toggle isDateRangeAnnual state
  function handleDateRangeAnnualChange() {
    if (!matchedDateRangeAnnual) return;

    updateDateRangeAnnual({
      ...matchedDateRangeAnnual,
      isDateRangeAnnual: !isDateRangeAnnual,
    });
  }

  return (
    <>
      {dateRanges.map((dateRange) => (
        <DateRange
          key={dateRange.id || dateRange.tempId}
          dateRange={dateRange}
          updateDateRange={updateDateRange}
          removeDateRange={removeDateRange}
        />
      ))}

      {/* Add fields if the button is clicked */}
      {hasMultipleDates && (
        <button
          type="button"
          className="btn btn-text text-link"
          onClick={() => addDateRange(dateType)}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="ms-1">Add more {dateType.name} dates</span>
        </button>
      )}

      <Form.Check
        type="checkbox"
        id={`date-range-annual-${dateType.id}`}
        name="DateRangeAnnual"
        label="Dates are the same every year"
        checked={isDateRangeAnnual}
        onChange={handleDateRangeAnnualChange}
      />
    </>
  );
}

DateRangeFields.propTypes = {
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      // Existing date ranges have an ID
      id: PropTypes.number,
      // New date ranges have a tempId
      tempId: PropTypes.string,
      // either id or tempId is required

      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ).isRequired,
  updateDateRange: PropTypes.func,
  removeDateRange: PropTypes.func,
  addDateRange: PropTypes.func,
  dateType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
  }).isRequired,
  dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateDateRangeAnnual: PropTypes.func.isRequired,
  hasMultipleDates: PropTypes.bool,
  dateType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  updateDateRange: PropTypes.func.isRequired,
  removeDateRange: PropTypes.func.isRequired,
  addDateRange: PropTypes.func.isRequired,
};
