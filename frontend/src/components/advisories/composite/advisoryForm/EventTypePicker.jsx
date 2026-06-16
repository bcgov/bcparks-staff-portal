import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";
import {
  filterOptionsByScope,
  hasSelectedItems,
} from "@/components/advisories/shared/categorySelect/categorySelectUtils";

export default function EventTypePicker({
  eventType,
  eventTypes,
  setEventType,
  selectedProtectedAreas,
  selectedRecreationResources,
  onBlur,
}) {
  const hasBcpResourcesSelected = hasSelectedItems(selectedProtectedAreas);
  const hasRstResourcesSelected = hasSelectedItems(selectedRecreationResources);

  // Filter event type options based on scope and selected resources (BCP or RST)
  const filteredEventTypes = useMemo(
    () =>
      filterOptionsByScope(
        eventTypes,
        hasBcpResourcesSelected,
        hasRstResourcesSelected,
      ),
    [eventTypes, hasBcpResourcesSelected, hasRstResourcesSelected],
  );

  // If the currently selected event type is not in the filtered list, reset the selection
  const selectedEventTypeOption = useMemo(
    () =>
      filteredEventTypes.find((option) => option.value === eventType) || null,
    [filteredEventTypes, eventType],
  );

  useEffect(() => {
    if (!eventType || !filteredEventTypes.length) {
      return;
    }

    // If the selected event type is not in the filtered list, reset the selection
    const hasSelectedEventType = filteredEventTypes.some(
      (option) => option.value === eventType,
    );

    // Only reset the event type selection if there is a selected event type that is not in the filtered list.
    if (!hasSelectedEventType) {
      setEventType(0);
    }
  }, [filteredEventTypes, eventType, setEventType]);

  return (
    <CategorySelect
      id="event-type"
      options={filteredEventTypes}
      value={selectedEventTypeOption}
      onChange={(option) => setEventType(option ? option.value : 0)}
      placeholder="Search or select an event type"
      onBlur={onBlur}
      isClearable
      defaultMenuLabel={(option) => option.label}
    />
  );
}

EventTypePicker.propTypes = {
  eventType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  eventTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  setEventType: PropTypes.func.isRequired,
  selectedProtectedAreas: PropTypes.array,
  selectedRecreationResources: PropTypes.array,
  onBlur: PropTypes.func,
};
