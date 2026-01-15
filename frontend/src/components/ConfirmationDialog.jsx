import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fa-kit/icons/classic/regular";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
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
  return (
    <Modal
      centered
      dialogClassName="confirmation-dialog-wrap"
      contentClassName="confirmation-dialog-modal"
      show={isOpen}
      onHide={onCancel}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="confirmation-dialog-message">{message}</p>
        <p className="confirmation-dialog-message">{notes}</p>
      </Modal.Body>

      {/* Custom modal-footer markup so we can use different button classes */}
      <div className="modal-footer">
        <button className="btn btn-outline-primary" onClick={onCancel}>
          {cancelButtonText}
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          {confirmButtonText}
        </button>
      </div>
    </Modal>
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
