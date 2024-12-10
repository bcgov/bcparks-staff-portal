// FlashMessage.jsx
import PropTypes from "prop-types";
import "./FlashMessage.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faCheck } from "@fa-kit/icons/classic/regular";

function FlashMessage({
  title,
  message,
  isVisible,
  onClose,
  icon = faCheck,
  variant = "success",
}) {
  if (!isVisible) return null;

  return (
    <div className={`flash-message ${variant}`}>
      <span className="flash-message__icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="flash-message__content">
        <div className="flash-message__title">{title}</div>
        {variant === "success" && (
          <div className="flash-message__subtitle">{message}</div>
        )}
      </div>
      <button onClick={onClose} className="flash-message__close">
        <FontAwesomeIcon icon={faClose} />
      </button>
    </div>
  );
}

export default FlashMessage;

// add propTypes for FlashMessage
FlashMessage.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(["success", "error"]),
};
