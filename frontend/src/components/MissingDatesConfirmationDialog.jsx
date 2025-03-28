import { useMemo } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fa-kit/icons/classic/regular";
import "./ConfirmationDialog.scss";

function ConfirmationDialog({
  featureNames,
  inputMessage,
  setInputMessage,
  onCancel,
  onConfirm,
  isOpen,
}) {
  const wordCount = useMemo(
    () => inputMessage.split(" ").filter((word) => word).length,
    [inputMessage],
  );

  if (!isOpen) return null;

  const maxWords = 250;

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog-container">
        <div className="confirmation-dialog-header">
          <h3 className="confirmation-dialog-title">
            Submit with missing dates?
          </h3>
          <button onClick={onCancel} className="confirmation-dialog-close">
            <FontAwesomeIcon icon={faClose} />
          </button>
        </div>

        <div className="missing-dates-confirmation-dialog-message">
          The following dates are missing:{" "}
        </div>

        <ul>
          {featureNames.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>

        <div className="missing-dates-confirmation-dialog-message">
          Please explain why the missing dates are not available:{" "}
        </div>
        <div className="form-group mb-4">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="form-control"
          ></textarea>
          <div className="info-row mt-1">
            <div className="required-message">Required</div>
            <div className="word-count">
              {wordCount}/{maxWords}
            </div>
          </div>
        </div>

        <div className="confirmation-dialog-actions">
          <button className="btn btn-outline-primary" onClick={onCancel}>
            Continue editing
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!inputMessage || wordCount > maxWords}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmationDialog.propTypes = {
  featureNames: PropTypes.array.isRequired,
  inputMessage: PropTypes.string.isRequired,
  setInputMessage: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default ConfirmationDialog;
