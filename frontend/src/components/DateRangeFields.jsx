import { useMemo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { sortBy } from "lodash-es";
import { faPlus, faXmark } from "@fa-kit/icons/classic/regular";
import { addDays } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Form from "react-bootstrap/Form";

import DootDatePicker from "@/components/DatePicker";
import ErrorSlot from "@/components/ValidationErrorSlot";
import { useValidationContext } from "@/hooks/useValidation/useValidation";

// Maximum valid JavaScript date (September 13, 275760)
const MAX_DATE = new Date(8640000000000000);

function DateRange({
  dateRange,
  updateDateRange,
  removeDateRange,
  removable = true,
  isDateRangeAnnual,
  minDate,
  maxDate,
}) {
  // A unique ID for template loops and selectors
  const idOrTempId = dateRange.id || dateRange.tempId;

  const { elements } = useValidationContext();

  // Call the update method from the parent
  function onSelect(dateField, dateObj) {
    // Existing ranges have an ID
    if (dateRange.id) {
      return updateDateRange(dateRange.id, dateField, dateObj);
    }

    // New ranges have a tempId
    return updateDateRange(dateRange.tempId, dateField, dateObj, true);
  }

  return (
    <div className="mb-2">
      <div className="d-flex mb-2">
        <div className="form-group">
          <label className="form-label d-lg-none">Start date</label>
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

        <div className="date-range-dash d-none d-lg-flex align-items-start pt-2 px-lg-2">
          <span>&ndash;</span>
        </div>

        <div className="form-group">
          <label className="form-label d-lg-none">End date</label>
          <DootDatePicker
            id={idOrTempId}
            dateField="endDate"
            minDate={
              dateRange.startDate ? addDays(dateRange.startDate, 1) : minDate
            }
            maxDate={maxDate}
            disabled={isDateRangeAnnual}
            date={dateRange.endDate}
            onSelect={onSelect}
          />
        </div>

        <div className="align-self-start">
          <div className="form-label d-lg-none">
            &nbsp;
            <span className="visually-hidden">Remove this date range</span>
          </div>

          <button
            // Disable and hide the remove button if this is the first/only date range
            className={classNames("btn btn-text text-link", {
              invisible: !removable,
            })}
            disabled={!removable}
            onClick={() => removeDateRange(dateRange)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>

      <ErrorSlot element={elements.dateRange(idOrTempId)} />
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
  // Allow removal only if it's not the first date range
  removable: PropTypes.bool,
  isDateRangeAnnual: PropTypes.bool.isRequired,
  minDate: PropTypes.instanceOf(Date).isRequired,
  maxDate: PropTypes.instanceOf(Date).isRequired,
};

export default function DateRangeFields({
  dateableId,
  dateRanges,
  updateDateRange,
  removeDateRange,
  addDateRange,
  dateType,
  operatingYear,
  isWinterSeason = false,
  dateRangeAnnuals,
  updateDateRangeAnnual,
  optional = false,
}) {
  const { elements } = useValidationContext();
  // Constants
  // Tier 1 only allows 1 date range
  const hasMultipleDates = dateType.name !== "Tier 1";

  // Functions
  // find the matching dateRangeAnnual for this dateableId and dateType
  const matchedDateRangeAnnual = useMemo(() => {
    if (!dateableId || !dateType || !dateRangeAnnuals) return null;

    return dateRangeAnnuals.find(
      (dateRangeAnnual) =>
        dateRangeAnnual.dateableId === dateableId &&
        dateRangeAnnual.dateType?.id === dateType.id,
    );
  }, [dateableId, dateType, dateRangeAnnuals]);

  // Sort dateRanges by startDate on initial render
  useMemo(() => {
    sortBy(dateRanges, (dateRange) => dateRange.startDate || MAX_DATE)
      // Mutate the prop to assign a sortIndex to each dateRange
      .forEach((dateRange, index) => {
        // Re-organization of dates only occurs when the page is
        // saved, submitted, or approved
        dateRange.sortIndex = index;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only update the sort when the component mounts
  }, []);

  const dateRangeAnnualId = matchedDateRangeAnnual?.id
    ? matchedDateRangeAnnual.id
    : `${dateableId}-${dateType.id}`;

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
        dateableId,
        isDateRangeAnnual: true,
        dateType: { id: dateType.id, name: dateType.name },
      });
    }
  }

  // Min and max dates for the date picker control
  let minDate;
  let maxDate;

  if (isWinterSeason) {
    // Winter seasons
    minDate = new Date(operatingYear, 9, 1); // Oct 1 of the season's operating year
    maxDate = new Date(operatingYear + 1, 2, 31); // Mar 31 of the year after that
  } else {
    // Regular seasons
    minDate = new Date(operatingYear, 0, 1); // Jan 1 of the season's operating year
    maxDate = new Date(operatingYear, 11, 31); // Dec 31 of the season's operating year
  }

  return (
    <>
      {[...dateRanges]
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .map((dateRange, index) => (
          <DateRange
            key={dateRange.id || dateRange.tempId}
            dateRange={dateRange}
            updateDateRange={updateDateRange}
            removeDateRange={removeDateRange}
            removable={optional || index > 0}
            isDateRangeAnnual={isDateRangeAnnual}
            minDate={minDate}
            maxDate={maxDate}
          />
        ))}

      {/* display it if date type is not "Tier 1" or no dateRanges exist */}
      {(hasMultipleDates || dateRanges.length === 0) && (
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

      <ErrorSlot
        element={elements.dateableDateType(dateableId, dateType.name)}
      />
    </>
  );
}

DateRangeFields.propTypes = {
  dateableId: PropTypes.number.isRequired,
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
  operatingYear: PropTypes.number.isRequired,
  isWinterSeason: PropTypes.bool,
  dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateDateRangeAnnual: PropTypes.func.isRequired,
  optional: PropTypes.bool,
};
