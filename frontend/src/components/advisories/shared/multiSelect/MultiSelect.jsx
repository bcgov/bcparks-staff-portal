import PropTypes from "prop-types";
import Form from "react-bootstrap/Form";
import Select, { components } from "react-select";
import "./MultiSelect.scss";

function CheckboxOption(props) {
  const { isSelected, label } = props;

  return (
    <components.Option {...props}>
      <div className="multi-select-option">
        <input
          className="multi-select-option-checkbox"
          type="checkbox"
          checked={isSelected}
          readOnly
          tabIndex={-1}
        />
        <span>{label}</span>
      </div>
    </components.Option>
  );
}

CheckboxOption.propTypes = {
  isSelected: PropTypes.bool,
  label: PropTypes.string,
};

export function MultiSelect({
  label,
  countLabel,
  value,
  options,
  onChange,
  placeholder,
}) {
  const displayPlaceholder =
    value.length > 0 ? `${countLabel} (${value.length})` : placeholder;

  return (
    <>
      {label && <Form.Label className="mb-1">{label}</Form.Label>}
      <Select
        value={value}
        options={options}
        components={{ Option: CheckboxOption }}
        onChange={onChange}
        placeholder={displayPlaceholder}
        className="bcgov-select"
        isMulti
        isClearable
        hideSelectedOptions={false}
        controlShouldRenderValue={false}
        closeMenuOnSelect={false}
        styles={{
          menu: (base) => ({ ...base, zIndex: 999 }),
        }}
      />
    </>
  );
}

MultiSelect.propTypes = {
  label: PropTypes.string,
  countLabel: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};

MultiSelect.defaultProps = {
  label: "",
  countLabel: "",
  value: [],
  options: [],
  onChange() {},
  placeholder: "Select...",
};
