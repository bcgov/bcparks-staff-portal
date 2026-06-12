import { useMemo } from "react";
import PropTypes from "prop-types";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";

// Display category and label if they are different, otherwise just display the label
function formatEventTypeLabel(option) {
  const label = option?.label || "";
  const category = option?.category || "";
  const isCategoryUnique = category === label;

  if (isCategoryUnique) {
    return label;
  }

  return `${category} - ${label}`;
}

export default function EventTypePicker({
  eventType,
  eventTypes,
  setEventType,
  onBlur,
}) {
  const selectedEventTypeOption = useMemo(
    () => eventTypes.find((option) => option.value === eventType) || null,
    [eventTypes, eventType],
  );

  return (
    <CategorySelect
      id="event-type"
      options={eventTypes}
      value={selectedEventTypeOption}
      onChange={(option) => setEventType(option ? option.value : 0)}
      placeholder="Search or select an event type"
      onBlur={onBlur}
      isClearable
      formatValueLabel={formatEventTypeLabel}
      formatMenuLabel={(option) => option.label}
    />
  );
}

EventTypePicker.propTypes = {
  eventType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  eventTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  setEventType: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
};
