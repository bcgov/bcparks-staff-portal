import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { sortBy } from "lodash-es";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";
import {
  filterOptionsByScope,
  hasSelectedItems,
} from "@/components/advisories/shared/categorySelect/categorySelectUtils";

const CATEGORIES = {
  closed: 1,
  restricted: 2,
  "limited access": 3,
  "visit with caution": 4,
  "seasonal restrictions": 5,
  open: 6,
};

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

  // Sort access statuses by category order first, then alphabetically by label
  const sortedAccessStatuses = useMemo(
    () =>
      sortBy(filteredAccessStatuses, [
        (status) =>
          CATEGORIES[(status.category || "").toLowerCase()] ??
          Number.POSITIVE_INFINITY,
        (status) => (status.label || "").toLowerCase(),
      ]),
    [filteredAccessStatuses],
  );

  // If the currently selected access status is not in the filtered list, select the first option by default (if available)
  const selectedAccessStatusOption = useMemo(
    () =>
      sortedAccessStatuses.find((option) => option.value === accessStatus) ||
      null,
    [sortedAccessStatuses, accessStatus],
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

    if (!sortedAccessStatuses.length) {
      return;
    }

    // If the selected access status is not in the filtered options, select the first option by default
    const hasSelectedAccessStatus = sortedAccessStatuses.some(
      (option) => option.value === accessStatus,
    );

    // Only update access status if the current selected access status is not in the filtered list, to avoid unnecessary updates
    if (!hasSelectedAccessStatus) {
      setAccessStatus(sortedAccessStatuses[0].value);
    }
  }, [
    sortedAccessStatuses,
    accessStatus,
    setAccessStatus,
    isRecreationUser,
    isCleared,
  ]);

  return (
    <CategorySelect
      id="resource-status"
      value={selectedAccessStatusOption}
      options={sortedAccessStatuses}
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
      sortGroupsByLabel={false}
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
