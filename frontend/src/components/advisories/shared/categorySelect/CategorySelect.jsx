import { useId, useMemo } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import Select from "react-select";

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
  getSearchText,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const hasSelection = Boolean(value);

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

    const groups = options.reduce((accumulator, option) => {
      const category = option[categoryKey];

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(option);
      return accumulator;
    }, {});

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
      inputId={selectId}
      instanceId={selectId}
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

        const searchText = (
          getSearchText
            ? getSearchText(data)
            : defaultGetSearchText(data, categoryKey)
        )
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
  getSearchText: PropTypes.func,
};
