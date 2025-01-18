import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
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
  const dropdownRef = useRef(null);

  // Bind event listener to close the dropdown when clicking outside
  useEffect(() => {
    // Closes the dropdown menu if the click event happened anywhere else on the page.
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      // Check if the click event happened inside the dropdown or on the checkbox.
      // The checkboxes re-render a lot, so we can only check their immediate parent.
      const clickInside =
        dropdownRef.current.contains(event.target) ||
        event.target.closest("div.form-check");

      if (!clickInside) {
        setExpanded(false);
      }
    }

    // Add event listener when the dropdown is expanded
    if (expanded) {
      document.addEventListener("click", handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [expanded]);

  function toggleExpanded(event) {
    // Prevent the click event from bubbling up to the document
    event.stopPropagation();
    setExpanded(!expanded);
  }

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

      <div
        className={classNames("dropdown-menu", "p-4", { show: expanded })}
        ref={dropdownRef}
      >
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
