import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { keyBy, mapValues, sortBy } from "lodash-es";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";
import {
  filterOptionsByScope,
  hasSelectedItems,
} from "@/components/advisories/shared/categorySelect/categorySelectUtils";

const CATEGORIES = [
  { name: "Wildfire", sortOrder: 1 },
  { name: "Environmental", sortOrder: 2 },
  { name: "Access", sortOrder: 3 },
  { name: "Public safety", sortOrder: 4 },
  { name: "Wildlife", sortOrder: 5 },
  { name: "Seasonal restrictions", sortOrder: 6 },
  { name: "Pandemic", sortOrder: 7 },
];

// Map category names to their sort order
const CATEGORY_SORT_ORDER = mapValues(
  keyBy(CATEGORIES, (category) => category.name.toLowerCase()),
  "sortOrder",
);

export default function StandardMessagePicker({
  standardMessages,
  selectedStandardMessages,
  setSelectedStandardMessages,
  selectedProtectedAreas,
  selectedRecreationResources,
}) {
  const hasBcpResourcesSelected = hasSelectedItems(selectedProtectedAreas);
  const hasRstResourcesSelected = hasSelectedItems(selectedRecreationResources);
  const hasBothResourcesSelected =
    hasBcpResourcesSelected && hasRstResourcesSelected;

  // Filter message options based on scope and selected resources (BCP or RST)
  const filteredStandardMessages = useMemo(
    () =>
      filterOptionsByScope(
        standardMessages,
        hasBcpResourcesSelected,
        hasRstResourcesSelected,
      ),
    [standardMessages, hasBcpResourcesSelected, hasRstResourcesSelected],
  );

  // Sort messages by category order first, then alphabetically by label
  const sortedStandardMessages = useMemo(
    () =>
      sortBy(filteredStandardMessages, [
        (message) =>
          CATEGORY_SORT_ORDER[(message.category || "").toLowerCase()] ??
          Number.POSITIVE_INFINITY,
        (message) => (message.label || "").toLowerCase(),
      ]),
    [filteredStandardMessages],
  );

  // Keep only selected messages that remain in the current scope.
  useEffect(() => {
    const currentSelectedMessages = selectedStandardMessages || [];

    const filteredSelectedMessages = currentSelectedMessages.filter(
      (selectedMessage) =>
        filteredStandardMessages.some(
          (option) => option.value === selectedMessage?.value,
        ),
    );

    if (filteredSelectedMessages.length !== currentSelectedMessages.length) {
      setSelectedStandardMessages(filteredSelectedMessages);
    }
  }, [
    filteredStandardMessages,
    selectedStandardMessages,
    setSelectedStandardMessages,
  ]);

  return (
    <CategorySelect
      id="standard-messages"
      options={sortedStandardMessages}
      value={selectedStandardMessages}
      onChange={(messages) => {
        setSelectedStandardMessages(messages || []);
      }}
      placeholder={
        hasBothResourcesSelected
          ? "No options available based on your resource selection"
          : "Search or select standard message(s)"
      }
      defaultMenuLabel={(option) => option.label}
      sortGroupsByLabel={false}
      isDisabled={hasBothResourcesSelected}
      isMulti={true}
      isClearable
    />
  );
}

StandardMessagePicker.propTypes = {
  standardMessages: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedStandardMessages: PropTypes.arrayOf(PropTypes.object),
  setSelectedStandardMessages: PropTypes.func.isRequired,
  selectedProtectedAreas: PropTypes.array,
  selectedRecreationResources: PropTypes.array,
};
