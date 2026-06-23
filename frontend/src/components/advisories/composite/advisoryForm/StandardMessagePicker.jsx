import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { sortBy } from "lodash-es";
import CategorySelect from "@/components/advisories/shared/categorySelect/CategorySelect";
import {
  filterOptionsByScope,
  hasSelectedItems,
} from "@/components/advisories/shared/categorySelect/categorySelectUtils";

const CATEGORIES = {
  wildfire: 1,
  environmental: 2,
  access: 3,
  "public safety": 4,
  wildlife: 5,
  "seasonal restrictions": 6,
  pandemic: 7,
};

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
          CATEGORIES[(message.category || "").toLowerCase()] ??
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
