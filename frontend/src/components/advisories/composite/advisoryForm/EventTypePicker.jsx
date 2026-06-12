import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";

// Check if there are selected items in the array
function hasSelectedItems(items) {
  return Array.isArray(items) && items.length > 0;
}

// Display category and label if they are different, otherwise just display the label
function formatEventTypeLabel(option) {
  const label = option?.label || "";
  const category = option?.category || "";
  const isCategoryUnique = !category || category === label;

  if (isCategoryUnique) {
    return label;
  }

  return `${category} - ${label}`;
}

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
  const filteredEventTypes = useMemo(() => {
    // Both BCP and RST are selected, show only event types with scope "Both"
    if (hasBcpResourcesSelected && hasRstResourcesSelected) {
      return eventTypes.filter((option) => option.scope === "Both");
    }

    // Only BCP resources are selected, show event types with scope "BCP" or "Both"
    if (hasBcpResourcesSelected) {
      return eventTypes.filter((option) => {
        const scope = option.scope;

        return scope === "BCP" || scope === "Both";
      });
    }

    // Only RST resources are selected, show event types with scope "RST" or "Both"
    if (hasRstResourcesSelected) {
      return eventTypes.filter((option) => {
        const scope = option.scope;

        return scope === "RST" || scope === "Both";
      });
    }

    return eventTypes;
  }, [eventTypes, hasBcpResourcesSelected, hasRstResourcesSelected]);

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
      formatValueLabel={formatEventTypeLabel}
      formatMenuLabel={(option) => option.label}
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
