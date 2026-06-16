import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";

// Check if there are selected items in the array
function hasSelectedItems(items) {
  return Array.isArray(items) && items.length > 0;
}

// Display category and label if they are different, otherwise just display the label
function formatAccessStatusLabel(option) {
  const label = option?.label || "";
  const category = option?.category || "";
  const isCategoryUnique = !category || category === label;

  if (isCategoryUnique) {
    return label;
  }

  return `${category} - ${label}`;
}

export default function AccessStatusPicker({
  accessStatus,
  accessStatuses,
  setAccessStatus,
  selectedProtectedAreas,
  selectedRecreationResources,
  isRecreationUser = false,
}) {
  const hasBcpResourcesSelected = hasSelectedItems(selectedProtectedAreas);
  const hasRstResourcesSelected = hasSelectedItems(selectedRecreationResources);

  // Filter access status options based on scope and selected resources (BCP or RST)
  const filteredAccessStatuses = useMemo(() => {
    // Both BCP and RST are selected, show only access statuses with scope "Both"
    if (hasBcpResourcesSelected && hasRstResourcesSelected) {
      return accessStatuses.filter((option) => option.scope === "Both");
    }

    // Only BCP resources are selected, show access statuses with scope "BCP" or "Both"
    if (hasBcpResourcesSelected) {
      return accessStatuses.filter((option) => {
        const scope = option.scope;

        return scope === "BCP" || scope === "Both";
      });
    }

    // Only RST resources are selected, show access statuses with scope "RST" or "Both"
    if (hasRstResourcesSelected) {
      return accessStatuses.filter((option) => {
        const scope = option.scope;

        return scope === "RST" || scope === "Both";
      });
    }

    return accessStatuses;
  }, [accessStatuses, hasBcpResourcesSelected, hasRstResourcesSelected]);

  // If the currently selected access status is not in the filtered list, select the first option by default (if available)
  const selectedAccessStatusOption = useMemo(
    () =>
      filteredAccessStatuses.find((option) => option.value === accessStatus) ||
      null,
    [filteredAccessStatuses, accessStatus],
  );

  useEffect(() => {
    // Do not pre select access status for RST users
    if (isRecreationUser) {
      return;
    }

    if (!filteredAccessStatuses.length) {
      return;
    }

    // If the selected access status is not in the filtered options, select the first option by default
    const hasSelectedAccessStatus = filteredAccessStatuses.some(
      (option) => option.value === accessStatus,
    );

    // Only update access status if the current selected access status is not in the filtered list, to avoid unnecessary updates
    if (!hasSelectedAccessStatus) {
      setAccessStatus(filteredAccessStatuses[0].value);
    }
  }, [filteredAccessStatuses, accessStatus, setAccessStatus, isRecreationUser]);

  return (
    <CategorySelect
      id="resource-status"
      value={selectedAccessStatusOption}
      options={filteredAccessStatuses}
      onChange={(option) => setAccessStatus(option ? option.value : 0)}
      placeholder="Search or select public access status"
      formatValueLabel={formatAccessStatusLabel}
      formatMenuLabel={(option) => option.label}
    />
  );
}

AccessStatusPicker.propTypes = {
  accessStatus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  accessStatuses: PropTypes.arrayOf(PropTypes.object).isRequired,
  setAccessStatus: PropTypes.func.isRequired,
  selectedProtectedAreas: PropTypes.array,
  selectedRecreationResources: PropTypes.array,
  isRecreationUser: PropTypes.bool,
};
