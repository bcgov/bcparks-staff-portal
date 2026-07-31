import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function IconButton({
  icon,
  label,
  extraClassName,
  loading = false,
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      type="button"
      className={classNames("btn btn-text text-link", extraClassName)}
      disabled={isDisabled}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status" />
      ) : (
        <FontAwesomeIcon icon={icon} />
      )}
      <span className="ms-1">{label}</span>
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  extraClassName: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};
