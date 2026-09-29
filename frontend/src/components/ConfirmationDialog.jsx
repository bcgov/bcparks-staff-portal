import PropTypes from "prop-types";
import {
  AlertDialog,
  Button,
  Modal,
} from "@bcgov/design-system-react-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fa-kit/icons/classic/regular";
import "./ConfirmationDialog.scss";

/**
 * Modal confirmation dialog used throughout the staff portal.
 * Built on the BC Gov Design System AlertDialog.
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
      // Hook for the z-index override in ConfirmationDialog.scss
      // (a className would replace the BC Design System class)
      data-confirmation-dialog
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialog
        // AlertDialog renders the title in a plain div, not a <Heading slot="title">,
        // so name the dialog explicitly for screen readers
        aria-label={title}
        // No title icon, per design
        isIconHidden
        title={title}
        buttons={
          <>
            <Button
              // Borderless, to match the BC Design System dialog examples
              variant="tertiary"
              danger={isDanger}
              onPress={onSecondary}
            >
              {isDanger && <FontAwesomeIcon icon={faTrash} />}
              {secondaryButtonText}
            </Button>

            <Button variant="primary" onPress={onPrimary}>
              {primaryButtonText}
            </Button>
          </>
        }
      >
        {typeof message === "string" ? <p>{message}</p> : message}
      </AlertDialog>
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
