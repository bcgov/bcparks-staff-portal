import { useContext, useMemo, useState } from "react";
import { faPlus, faCalendarCheck } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

import {
  formatDateRange,
  normalizeToUTCDate,
  normalizeToLocalDate,
} from "@/lib/utils";
// import DataContext from "@/contexts/DataContext";

function DateRange({ dateRange, updateDateRange }) {
  // const { setData } = useContext(DataContext);

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
    if (dateField.id) {
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
    </div>
  );
}

export default function DateRangeFields({
  dateRanges,
  updateDateRange,
  addDateRange,
  hasMultipleDates = true,
  dateableId,
  dateType,
}) {
  console.log("dateableId", dateableId);
  console.log("dateType", dateType);

  return (
    <>
      {dateRanges.map((dateRange) => (
        <DateRange
          key={dateRange.id || dateRange.tempId}
          dateRange={dateRange}
          updateDateRange={updateDateRange}
        />
      ))}

      {/* TODO: add fields if the button is clicked */}
      {hasMultipleDates && (
        <button
          type="button"
          className="btn btn-text text-link"
          onClick={() => addDateRange(dateType)}
        >
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
      // Existing date ranges have an ID
      id: PropTypes.number,
      // New date ranges have a tempId
      tempId: PropTypes.string,
      // either id or tempId is required

      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
    }),
  ).isRequired,
  hasMultipleDates: PropTypes.bool,
};
