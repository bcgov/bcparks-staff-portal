import PropTypes from "prop-types";
import Form from "react-bootstrap/Form";

function RadioButtonGroup({
  id,
  name,
  options,
  value,
  onChange,
}) {
  return (
    <Form>
      {options.map((option, index) => (
        <Form.Check
          key={index}
          id={`${id}--${option.value}`}
          type="radio"
          label={option.label}
          name={name || id}
          value={String(option.value)}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
        />
      ))}
    </Form>
  );
}

export default RadioButtonGroup;

RadioButtonGroup.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onChange: PropTypes.func.isRequired,
};
