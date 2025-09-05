import PropTypes from "prop-types";
import Select from "react-select";

function MultiSelectField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  optionLabel,
  optionValue,
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Select
        isMulti
        name={id}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        getOptionLabel={(e) => e[optionLabel]}
        getOptionValue={(e) => e[optionValue]}
        className="multi-select-field"
        classNamePrefix="react-select"
      />
    </div>
  );
}

MultiSelectField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  optionLabel: PropTypes.string,
  optionValue: PropTypes.string,
};

export default MultiSelectField;
