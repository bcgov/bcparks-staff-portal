import PropTypes from "prop-types";

// TODO: repleace a custom switch with this component
function SwitchToggle({ id, label, checked, onChange }) {
  return (
    <div className="form-check form-switch">
      <input
        id={id}
        role="switch"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="form-check-input label-switch"
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

SwitchToggle.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SwitchToggle;
