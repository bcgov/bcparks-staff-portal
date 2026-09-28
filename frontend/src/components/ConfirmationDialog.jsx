import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTriangleExclamation } from "@fa-kit/icons/classic/regular";
import "./ConfirmationDialog.scss";

/**
 * Modal confirmation dialog used throughout the staff portal.
 * Use with the useConfirmation hook, which provides these props.
 * @param {Object} props Component props
 * @param {string} props.title Dialog title
 * @param {React.ReactNode} props.message Body content. Strings are wrapped in a paragraph.
 * @param {string} props.primaryButtonText Text for the primary (right) button
 * @param {string} props.secondaryButtonText Text for the secondary (left) button
 * @param {"default"|"danger"} props.secondaryButtonVariant Style for the secondary button
 * @param {Function} props.onPrimary Called when the primary button is clicked
 * @param {Function} props.onSecondary Called when the secondary button is clicked
 * @param {Function} props.onClose Called on any dismissal (close button, Esc key, backdrop click)
 * @param {boolean} props.isOpen Whether the dialog is visible
 * @returns {JSX.Element} Confirmation dialog
 */
export default function ConfirmationDialog({
  title,
  message,
  primaryButtonText,
  secondaryButtonText,
  secondaryButtonVariant = "default",
  onPrimary,
  onSecondary,
  onClose,
  isOpen,
}) {
  const isDanger = secondaryButtonVariant === "danger";

  return (
    <Modal
      centered
      dialogClassName="confirmation-dialog-wrap"
      contentClassName="confirmation-dialog-modal"
      show={isOpen}
      onHide={onClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon
            className="text-danger me-2"
            icon={faTriangleExclamation}
          />
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {typeof message === "string" ? <p>{message}</p> : message}
      </Modal.Body>

      {/* Custom modal-footer markup so we can use different button classes */}
      <div className="modal-footer">
        <button
          type="button"
          className={isDanger ? "btn text-danger" : "btn btn-outline-primary"}
          onClick={onSecondary}
        >
          {isDanger && <FontAwesomeIcon className="me-2" icon={faTrash} />}
          {secondaryButtonText}
        </button>

        <button type="button" className="btn btn-primary" onClick={onPrimary}>
          {primaryButtonText}
        </button>
      </div>
    </Modal>
  );
}

ConfirmationDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.node,
  primaryButtonText: PropTypes.string.isRequired,
  secondaryButtonText: PropTypes.string.isRequired,
  secondaryButtonVariant: PropTypes.oneOf(["default", "danger"]),
  onPrimary: PropTypes.func.isRequired,
  onSecondary: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
