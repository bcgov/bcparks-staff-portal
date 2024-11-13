import "./ConfirmationDialog.scss";

function ConfirmationDialog({ onConfirm, onCancel, isOpen }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Exit without saving?</h2>
          <button
            className="close-button"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>Discarded changes will be permanently deleted.</p>
        </div>
        <div className="modal-footer">
          <button className="button button-secondary" onClick={onCancel}>
            Continue editing
          </button>
          <button className="button button-primary" onClick={onConfirm}>
            Discard changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
