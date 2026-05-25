import { useId } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import Form from "react-bootstrap/Form";
import Select from "react-select";

export function SingleSelect({
  label = "",
  value = null,
  options = [],
  onChange = () => {},
  placeholder = "Select...",
}) {
  const generatedId = useId();
  const hasSelection = Boolean(value);

  return (
    <>
      {label && (
        <Form.Label htmlFor={generatedId} className="mb-1">
          {label}
        </Form.Label>
      )}
      <Select
        inputId={generatedId}
        instanceId={generatedId}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        className={classNames("bcgov-select", {
          "bcgov-select--has-selection": hasSelection,
        })}
        isClearable
        styles={{
          menu: (base) => ({ ...base, zIndex: 999 }),
        }}
      />
    </>
  );
}

SingleSelect.propTypes = {
  label: PropTypes.string,
  value: PropTypes.object,
  options: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
};
