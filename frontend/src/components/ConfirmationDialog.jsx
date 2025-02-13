import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fa-kit/icons/classic/regular";
import "./ConfirmationDialog.scss";

function ConfirmationDialog({
  title,
  message,
  confirmButtonText,
  cancelButtonText,
  notes,
  onCancel,
  onConfirm,
  isOpen,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog-container">
        <div className="confirmation-dialog-header">
          <h3 className="confirmation-dialog-title">{title}</h3>
          <button onClick={onCancel} className="confirmation-dialog-close">
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <p className="confirmation-dialog-message">{message}</p>
        <p className="confirmation-dialog-message">{notes}</p>
        <div className="confirmation-dialog-actions">
          <button className="btn btn-outline-primary" onClick={onCancel}>
            {cancelButtonText}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmationDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmButtonText: PropTypes.string.isRequired,
  cancelButtonText: PropTypes.string.isRequired,
  notes: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default ConfirmationDialog;
