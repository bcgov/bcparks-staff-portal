import { useMemo } from "react";
import PropTypes from "prop-types";
import { faPlus, faXmark } from "@fa-kit/icons/classic/regular";
import { startOfYear, endOfYear, addYears } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Form from "react-bootstrap/Form";

import DootDatePicker from "@/components/DatePicker";
import { normalizeToUTCDate } from "@/lib/utils";

function DateRange({
  dateRange,
  updateDateRange,
  removeDateRange,
  isDateRangeAnnual,
}) {
  // A unique ID for template loops and selectors
  const idOrTempId = dateRange.id || dateRange.tempId;

  // Min and max dates: Jan 1 of this year and Dec 31 of next year
  // @TODO: Update this when validation is implemented
  const minDate = useMemo(() => startOfYear(new Date()), []);
  const maxDate = useMemo(() => endOfYear(addYears(new Date(), 1)), []);

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
          <DootDatePicker
            id={idOrTempId}
            dateField="startDate"
            minDate={minDate}
            maxDate={maxDate}
            disabled={isDateRangeAnnual}
            date={dateRange.startDate}
            onSelect={onSelect}
          />
        </div>
      </div>

      <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
        <span>&ndash;</span>
      </div>

      <div className="form-group">
        <label className="form-label d-lg-none">End date</label>
        <div className="input-with-append">
          <DootDatePicker
            id={idOrTempId}
            dateField="endDate"
            minDate={minDate}
            maxDate={maxDate}
            disabled={isDateRangeAnnual}
            date={dateRange.endDate}
            onSelect={onSelect}
          />
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
  isDateRangeAnnual: PropTypes.bool.isRequired,
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
      (dateRangeAnnual) => dateRangeAnnual.dateType?.id === dateType.id,
    );
  }, [dateType, dateRangeAnnuals]);

  const dateRangeAnnualId = matchedDateRangeAnnual?.id ?? dateType.id ?? null;
  const isDateRangeAnnual = matchedDateRangeAnnual?.isDateRangeAnnual ?? false;

  // toggle isDateRangeAnnual state
  function handleDateRangeAnnualChange() {
    if (matchedDateRangeAnnual) {
      updateDateRangeAnnual({
        ...matchedDateRangeAnnual,
        isDateRangeAnnual: !isDateRangeAnnual,
      });
    } else {
      // if no match, create a new dateRangeAnnual with the current dateType
      updateDateRangeAnnual({
        isDateRangeAnnual: true,
        dateType: { id: dateType.id, name: dateType.name },
      });
    }
  }

  return (
    <>
      {dateRanges.map((dateRange) => (
        <DateRange
          key={dateRange.id || dateRange.tempId}
          dateRange={dateRange}
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
          disabled={isDateRangeAnnual}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="ms-1">Add more {dateType.name} dates</span>
        </button>
      )}

      {/* Display checkbox except for Tier 1 and Tier 2 */}
      {!(dateType.name === "Tier 1" || dateType.name === "Tier 2") && (
        <Form.Check
          type="checkbox"
          id={`date-range-annual-${dateRangeAnnualId}`}
          name={`date-range-annual-${dateRangeAnnualId}`}
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
