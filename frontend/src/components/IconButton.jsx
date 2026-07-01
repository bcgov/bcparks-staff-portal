import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function IconButton({
  icon,
  label,
  onClick,
  textColor,
  loading = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames("btn btn-text text-link", textColor)}
      disabled={disabled}
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
  textColor: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};
