import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";
import {
  filterOptionsByScope,
  hasSelectedItems,
} from "@/components/advisories/shared/categorySelect/categorySelectUtils";

export default function AccessStatusPicker({
  accessStatus,
  accessStatuses,
  setAccessStatus,
  selectedProtectedAreas,
  selectedRecreationResources,
  validation,
  isRecreationUser = false,
}) {
  const [isCleared, setIsCleared] = useState(false);
  const hasBcpResourcesSelected = hasSelectedItems(selectedProtectedAreas);
  const hasRstResourcesSelected = hasSelectedItems(selectedRecreationResources);

  // Filter access status options based on scope and selected resources (BCP or RST)
  const filteredAccessStatuses = useMemo(
    () =>
      filterOptionsByScope(
        accessStatuses,
        hasBcpResourcesSelected,
        hasRstResourcesSelected,
      ),
    [accessStatuses, hasBcpResourcesSelected, hasRstResourcesSelected],
  );

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

    // Allow users to clear the picker without immediately re-selecting a value
    if (isCleared) {
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
  }, [
    filteredAccessStatuses,
    accessStatus,
    setAccessStatus,
    isRecreationUser,
    isCleared,
  ]);

  return (
    <CategorySelect
      id="resource-status"
      value={selectedAccessStatusOption}
      options={filteredAccessStatuses}
      onChange={(option, actionMeta) => {
        if (actionMeta?.action === "clear") {
          setIsCleared(true);
          setAccessStatus(null);
          return;
        }

        setIsCleared(false);
        setAccessStatus(option ? option.value : null);
      }}
      onBlur={validation}
      placeholder="Search or select public access status"
      defaultMenuLabel={(option) => option.label}
      isClearable
    />
  );
}

AccessStatusPicker.propTypes = {
  accessStatus: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.oneOf([null]),
  ]),
  accessStatuses: PropTypes.arrayOf(PropTypes.object).isRequired,
  setAccessStatus: PropTypes.func.isRequired,
  selectedProtectedAreas: PropTypes.array,
  selectedRecreationResources: PropTypes.array,
  validation: PropTypes.func,
  isRecreationUser: PropTypes.bool,
};
