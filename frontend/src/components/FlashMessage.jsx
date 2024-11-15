// FlashMessage.jsx
import { useEffect } from "react";
import PropTypes from "prop-types";
import "./FlashMessage.scss";

function FlashMessage({
  title,
  message,
  isVisible,
  onClose,
  duration = 3000,
  icon = "✓",
  variant = "success",
}) {
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`flash-message ${variant}`}>
      <span className="flash-message__icon">{icon}</span>
      <div className="flash-message__content">
        <div className="flash-message__title">{title}</div>
        {variant === "success" && (
          <div className="flash-message__subtitle">{message}</div>
        )}
      </div>
      <button onClick={onClose} className="flash-message__close">
        ×
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
  duration: PropTypes.number,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(["success", "error"]),
};
