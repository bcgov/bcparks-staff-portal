import { useMemo } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import Select from "react-select";
import { groupBy, sortBy } from "lodash-es";
import { formatCategoryLabel } from "./categorySelectUtils";

// Search an option from both label and category
function defaultGetSearchText(option, categoryKey) {
  return [option?.label, option?.[categoryKey]].filter(Boolean);
}

// Sort options alphabetically by label
function sortOptionsByLabel(items) {
  return [...items].sort((left, right) =>
    (left?.label || "").localeCompare(right?.label || "", "en", {
      sensitivity: "base",
    }),
  );
}

export default function CategorySelect({
  id,
  value = null,
  options = [],
  onChange = () => {},
  onBlur,
  placeholder = "Select...",
  categoryKey = "category",
  sortGroupsByLabel = true,
  defaultMenuLabel,
  isDisabled = false,
  isMulti = false,
  isClearable = false,
}) {
  // value can be object for single select, array for multi select
  const hasSelection = Array.isArray(value) ? value.length > 0 : Boolean(value);

  function formatValueLabel(option) {
    return formatCategoryLabel(option, categoryKey);
  }

  const formatMenuLabel =
    defaultMenuLabel || ((option) => formatCategoryLabel(option, categoryKey));

  // Group options by category if categoryKey is provided and options have the categoryKey
  const groupedOptions = useMemo(() => {
    const categorizedOptions = options.filter((option) =>
      Boolean(option?.[categoryKey]),
    );

    // Keep track of options that cannot be categorized
    const uncategorizedOptions = options.filter(
      (option) => !option?.[categoryKey],
    );

    // Keep a flat sorted list if nothing can be categorized
    if (categorizedOptions.length === 0) {
      return sortOptionsByLabel(options);
    }

    // Group options by category
    const groups = groupBy(categorizedOptions, categoryKey);

    const groupedEntries = sortGroupsByLabel
      ? sortBy(Object.entries(groups), ([label]) => label.toLowerCase())
      : Object.entries(groups);

    const grouped = groupedEntries.map(([label, categoryOptions]) => ({
      label,
      options: sortOptionsByLabel(categoryOptions),
    }));

    // Keep categorized options grouped, and append uncategorized options
    // in an "Other" group at the end if they exist
    if (uncategorizedOptions.length > 0) {
      return [
        ...grouped,
        {
          label: "Other",
          options: sortOptionsByLabel(uncategorizedOptions),
        },
      ];
    }

    return grouped;
  }, [options, categoryKey, sortGroupsByLabel]);

  return (
    <Select
      inputId={id}
      instanceId={id}
      value={value}
      options={groupedOptions}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={classNames("bcgov-select", {
        "bcgov-select--has-selection": hasSelection,
      })}
      isDisabled={isDisabled}
      isMulti={isMulti}
      isClearable={isClearable}
      formatOptionLabel={(option, { context }) => {
        if (context === "value") {
          return formatValueLabel(option);
        }

        return formatMenuLabel(option);
      }}
      filterOption={({ data }, inputValue) => {
        const query = inputValue.trim().toLowerCase();

        if (!query) {
          return true;
        }

        const searchText = defaultGetSearchText(data, categoryKey)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchText.includes(query);
      }}
      styles={{
        menu: (base) => ({ ...base, zIndex: 999 }),
      }}
    />
  );
}

CategorySelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object),
  ]),
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  categoryKey: PropTypes.string,
  sortGroupsByLabel: PropTypes.bool,
  defaultMenuLabel: PropTypes.func,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  isClearable: PropTypes.bool,
};
