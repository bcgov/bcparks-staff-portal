import PropTypes from "prop-types";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import "./Button.css";

export function Button({
  hasLoader = false,
  onClick = () => {},
  label,
  styling,
  disabled = false,
  testId = "",
  leftIcon = null,
}) {
  return (
    <button
      className={`bcgov-button ${styling}`}
      onClick={onClick}
      type="button"
      disabled={disabled}
      data-test-id={testId}
    >
      {leftIcon}
      {label}
      {hasLoader && (
        <div className="bcgov-loader-show">
          <Loader />
        </div>
      )}
    </button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func,
  label: PropTypes.string.isRequired,
  styling: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
  hasLoader: PropTypes.bool,
  leftIcon: PropTypes.node,
};
