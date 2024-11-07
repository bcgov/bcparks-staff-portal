import PropTypes from "prop-types";
import { useState } from "react";
import classNames from "classnames";

export default function MultiSelect({
  options,
  onInput,
  value = [],
  children,
}) {
  function OptionCheckbox({ option }) {
    const id = `option-${option.value}`;

    function onOptionChange(event) {
      const { value: changedValue, checked } = event.target;

      const updatedOptions = checked
        ? [...value, changedValue]
        : value.filter((val) => val !== changedValue);

      onInput(updatedOptions); // Pass updated options to parent
    }

    return (
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          value={option.value}
          id={id}
          checked={value.includes(option.value)}
          onChange={onOptionChange}
        />
        <label className="form-check-label" htmlFor={id}>
          {option.label}
        </label>
      </div>
    );
  }

  OptionCheckbox.propTypes = {
    option: PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
  };

  const [expanded, setExpanded] = useState(false);

  function toggleExpanded() {
    setExpanded(!expanded);
  }

  const contentClasses = classNames("dropdown-menu", "p-4", { show: expanded });

  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn btn-outline-primary dropdown-toggle"
        aria-expanded={expanded}
        onClick={toggleExpanded}
      >
        {children}
      </button>

      <div className={contentClasses}>
        {options.map((o) => (
          <OptionCheckbox key={o.value} option={o} />
        ))}
      </div>
    </div>
  );
}

// Prop validation
MultiSelect.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onInput: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node,
};
