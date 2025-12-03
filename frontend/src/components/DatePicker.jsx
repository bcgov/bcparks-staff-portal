import { useState, memo } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck } from "@fa-kit/icons/classic/regular";
import ErrorSlot from "@/components/ValidationErrorSlot";
import { useValidationContext } from "@/hooks/useValidation/useValidation";

function DootDatePickerComponent({
  id,
  dateField,
  minDate,
  maxDate,
  disabled = false,
  date,
  onSelect,
}) {
  // Clone the date prop and store it in local state
  // This is so we can control the DatePicker without modifying the parent data
  // until the field is blurred or Enter is pressed
  const [localDate, setLocalDate] = useState(date && new Date(date));

  const { elements } = useValidationContext();

  // Updates the local date to control the DatePicker
  function onDateChange(dateObj) {
    setLocalDate(dateObj);
  }

  return (
    <>
      <div className="input-with-append">
        <DatePicker
          id={`date-range-${id}-${dateField}`}
          portalId={`date-picker-portal-${dateField}`}
          minDate={minDate}
          maxDate={maxDate}
          className={classNames("form-control", dateField)}
          selected={localDate}
          onChange={(newDate) => onDateChange(newDate)}
          onBlur={() => {
            // Update the `dates` object on blur
            onSelect(dateField, localDate);
          }}
          onKeyDown={(event) => {
            // Update the `dates` object on Enter
            if (event.key === "Enter" && event.target.tagName === "INPUT") {
              onSelect(dateField, localDate);
            }
          }}
          dateFormat="EEE, MMM d, yyyy"
          showMonthYearDropdown
          disabled={disabled}
          popperClassName="react-datepicker-popper-padded"
        />

        <FontAwesomeIcon className="append-content" icon={faCalendarCheck} />
      </div>

      <ErrorSlot element={elements.dateField(id, dateField)} />
    </>
  );
}

// Memoize the component to prevent re-renders unless the dates change
export default memo(DootDatePickerComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if the dates actually changed
  // Compare dates by timestamp
  const prevDate = prevProps.date?.getTime() || null;
  const nextDate = nextProps.date?.getTime() || null;

  // Also check other props that might affect rendering
  // (Don't check onSelect, since it won't change)
  return (
    prevDate === nextDate &&
    prevProps.id === nextProps.id &&
    prevProps.dateField === nextProps.dateField &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.minDate?.getTime() === nextProps.minDate?.getTime() &&
    prevProps.maxDate?.getTime() === nextProps.maxDate?.getTime()
  );
});

DootDatePickerComponent.propTypes = {
  // id (number) or tempId (string) for new date ranges
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  dateField: PropTypes.string.isRequired,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  disabled: PropTypes.bool,
  date: PropTypes.instanceOf(Date),
  onSelect: PropTypes.func.isRequired,
};
