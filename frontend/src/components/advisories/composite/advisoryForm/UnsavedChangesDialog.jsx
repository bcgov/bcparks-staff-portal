import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTriangleExclamation } from "@fa-kit/icons/classic/regular";
import "./UnsavedChangesDialog.scss";

/*
 * Modal dialog prompt to appear when the user attempts to navigate away from a form with unsaved changes.
 * Three resolution options: Save draft, Discard draft, or Cancel (close the dialog and return to the form).
 */

export default function UnsavedChangesDialog({
  onClose,
  onDiscard,
  onSaveDraft,
  isOpen,
  children = null,
}) {
  return (
    <Modal
      centered
      dialogClassName="confirmation-dialog-wrap"
      contentClassName="unsaved-changes-dialog-modal"
      show={isOpen}
      onHide={onClose}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon
            className="text-danger me-2"
            icon={faTriangleExclamation}
          />
          Save changes?
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {children ?? (
          <p>
            Unsaved changes will be permanently deleted if you do not save them.
          </p>
        )}
      </Modal.Body>

      <div className="modal-footer">
        <button type="button" className="btn text-danger" onClick={onDiscard}>
          <FontAwesomeIcon className="me-2" icon={faTrash} />
          Discard draft
        </button>

        <button type="button" className="btn btn-primary" onClick={onSaveDraft}>
          Save draft
        </button>
      </div>
    </Modal>
  );
}

UnsavedChangesDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node,
};
