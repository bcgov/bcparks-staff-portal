import PropTypes from "prop-types";
import "./ConfirmationDialog.scss";

function ConfirmationDialog({
  title,
  message,
  notes,
  onCancel,
  onConfirm,
  isOpen,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog-container">
        <h3 className="confirmation-dialog-title">{title}</h3>
        <p className="confirmation-dialog-message">{message}</p>
        <p className="confirmation-dialog-message">{notes}</p>
        <div className="confirmation-dialog-actions">
          <button className="btn btn-outline-primary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmationDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  notes: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default ConfirmationDialog;
