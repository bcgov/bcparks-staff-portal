import PropTypes from "prop-types";
import Form from "react-bootstrap/Form";

export default function SwitchButton({
  className = "",
  inputProps = {},
  ...props
}) {
  const classes = ["advisories-switch", className].filter(Boolean).join(" ");

  return (
    <Form.Check type="switch" className={classes} {...inputProps} {...props} />
  );
}

SwitchButton.propTypes = {
  className: PropTypes.string,
  inputProps: PropTypes.object,
};
