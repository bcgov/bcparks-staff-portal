import { useMemo } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import Select from "react-select";
import { groupBy } from "lodash-es";

function defaultFormatLabel(option) {
  return option?.label || "";
}

// Search an option from both label and category
function defaultGetSearchText(option, categoryKey) {
  return [option?.label, option?.[categoryKey]].filter(Boolean);
}

export default function CategorySelect({
  id,
  value = null,
  options = [],
  onChange = () => {},
  placeholder = "Select...",
  categoryKey = "category",
  formatValueLabel = defaultFormatLabel,
  formatMenuLabel = defaultFormatLabel,
}) {
  const hasSelection = Boolean(value);

  // Group options by category if categoryKey is provided and options have the categoryKey
  const groupedOptions = useMemo(() => {
    const categorizedOptions = options.filter(
      (option) => option?.[categoryKey],
    );

    if (categorizedOptions.length !== options.length) {
      return [...options].sort((left, right) =>
        (left?.label || "").localeCompare(right?.label || "", "en", {
          sensitivity: "base",
        }),
      );
    }

    // Group options by category
    const groups = groupBy(options, categoryKey);

    return Object.entries(groups).map(([label, categoryOptions]) => ({
      label,
      options: [...categoryOptions].sort((left, right) =>
        (left?.label || "").localeCompare(right?.label || "", "en", {
          sensitivity: "base",
        }),
      ),
    }));
  }, [options, categoryKey]);

  return (
    <Select
      inputId={id}
      instanceId={id}
      value={value}
      options={groupedOptions}
      onChange={onChange}
      placeholder={placeholder}
      className={classNames("bcgov-select", {
        "bcgov-select--has-selection": hasSelection,
      })}
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
  value: PropTypes.object,
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  categoryKey: PropTypes.string,
  formatValueLabel: PropTypes.func,
  formatMenuLabel: PropTypes.func,
};
