import { useMemo, useState, useEffect } from "react";
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

function DateRange({
  dateRange,
  previousDateRanges = [],
  updateDateRange,
  removeDateRange,
  isDateRangeAnnual,
}) {
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

  // Copy the previous year's date ranges if isDateRangeAnnual is TRUE
  useEffect(() => {
    if (
      isDateRangeAnnual &&
      !dateRange.startDate &&
      !dateRange.endDate &&
      previousDateRanges.length > 0
    ) {
      // Copy each date range from previous year and update to current year
      previousDateRanges.forEach((prevDateRange) => {
        if (prevDateRange.startDate && prevDateRange.endDate) {
          // Create new dates for current year
          const prevStartDate = normalizeToLocalDate(prevDateRange.startDate);
          const prevEndDate = normalizeToLocalDate(prevDateRange.endDate);
          const currentYear = prevStartDate.getFullYear() + 1;

          // Update to current year while keeping month and day
          const newStartDate = new Date(prevStartDate);
          const newEndDate = new Date(prevEndDate);

          newStartDate.setFullYear(currentYear);
          newEndDate.setFullYear(currentYear);

          // Update the new date range
          if (dateRange.id) {
            updateDateRange(dateRange.id, "startDate", newStartDate);
            updateDateRange(dateRange.id, "endDate", newEndDate);
          } else if (dateRange.tempId) {
            updateDateRange(dateRange.tempId, "startDate", newStartDate, true);
            updateDateRange(dateRange.tempId, "endDate", newEndDate, true);
          }
        }
      });
    }
  }, [isDateRangeAnnual, dateRange, previousDateRanges, updateDateRange]);

  // Update local state when the dateRange changes
  useEffect(() => {
    setLocalDateRange({ ...dateRange });
  }, [dateRange]);

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
            disabled={isDateRangeAnnual}
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
            disabled={isDateRangeAnnual}
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
  previousDateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ),
  updateDateRange: PropTypes.func.isRequired,
  removeDateRange: PropTypes.func.isRequired,
  isDateRangeAnnual: PropTypes.bool.isRequired,
};

export default function DateRangeFields({
  dateRanges,
  previousDateRanges,
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
      (dateRangeAnnual) => dateRangeAnnual.dateType.id === dateType.id,
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
          previousDateRanges={previousDateRanges}
          updateDateRange={updateDateRange}
          removeDateRange={removeDateRange}
          isDateRangeAnnual={isDateRangeAnnual}
        />
      ))}

      {/* Add fields if the button is clicked */}
      {hasMultipleDates && (
        <button
          type="button"
          className="btn btn-text text-link p-0"
          onClick={() => addDateRange(dateType)}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="ms-1">Add more {dateType.name} dates</span>
        </button>
      )}

      {/* Display checkbox except for Tier 1 and Tier 2 */}
      {!(dateType.name === "Tier 1" || dateType.name === "Tier 2") && (
        <Form.Check
          type="checkbox"
          id={`date-range-annual-${dateType.id}`}
          name={`date-range-annual-${dateType.id}`}
          label="Dates are the same every year"
          checked={isDateRangeAnnual}
          onChange={handleDateRangeAnnualChange}
          className="mt-2 mb-0"
        />
      )}
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
  previousDateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ),
  updateDateRange: PropTypes.func.isRequired,
  removeDateRange: PropTypes.func.isRequired,
  addDateRange: PropTypes.func.isRequired,
  dateType: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
  }).isRequired,
  dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateDateRangeAnnual: PropTypes.func.isRequired,
  hasMultipleDates: PropTypes.bool,
};
