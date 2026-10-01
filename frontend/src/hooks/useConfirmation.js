import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { faTriangleExclamation } from "@fa-kit/icons/classic/regular";

const ACTIONS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  CLOSE: "close",
};

// Default title icon and variant (icon colour) for every dialog
const DEFAULT_ICON = faTriangleExclamation;
const DEFAULT_VARIANT = "destructive";

const DEFAULT_UNSAVED_CHANGES_MESSAGE =
  "Unsaved changes will be permanently deleted if you do not save them.";

/*
 Hook for managing the ConfirmationDialog component.
 Provides promise-based functions to open the dialog and wait for the user's choice.
*/

export default function useConfirmation() {
  // Visibility state for the dialog
  const [isOpen, setIsOpen] = useState(false);

  // Text and button options for the current prompt
  const [options, setOptions] = useState({
    title: "",
    message: null,
    primaryButtonText: "",
    secondaryButtonText: "",
    secondaryButtonVariant: "default",
    variant: DEFAULT_VARIANT,
    icon: DEFAULT_ICON,
  });

  // Ref to track whether the dialog is currently open to prevent multiple prompts from stacking
  const isOpenRef = useRef(false);

  // Ref to hold the resolve function of the current dialog promise, so it can be resolved by the dialog's action buttons
  const resolvePromiseRef = useRef(null);

  // Resolves whichever action the user chose and resets the dialog state
  // so the next prompt can open fresh.
  const resolveDialog = useCallback((action) => {
    const resolve = resolvePromiseRef.current;

    resolvePromiseRef.current = null;
    isOpenRef.current = false;
    setIsOpen(false);

    if (resolve) {
      resolve(action);
    }
  }, []);

  /**
   * Opens the dialog with the provided options.
   * @param {Object} promptOptions Dialog text and button options
   * @returns {Promise<string>} Resolves to "primary", "secondary", or "close"
   */
  const prompt = useCallback(async (promptOptions) => {
    if (isOpenRef.current) {
      return ACTIONS.CLOSE;
    }

    isOpenRef.current = true;
    setOptions(promptOptions);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolvePromiseRef.current = resolve;
    });
  }, []);

  /**
   * Opens a confirm/cancel dialog.
   * @param {Object} params Dialog options
   * @param {string} params.title Dialog title
   * @param {React.ReactNode} params.message Dialog body content
   * @param {string} [params.confirmButtonText] Primary button text
   * @param {string} [params.cancelButtonText] Secondary button text
   * @param {"info"|"confirmation"|"warning"|"error"|"destructive"} [params.variant] Dialog variant, sets the icon colour
   * @param {Object} [params.icon] FontAwesome icon definition shown before the title
   * @returns {Promise<boolean>} True if confirmed, false if cancelled or dismissed
   */
  const open = useCallback(
    async ({
      title,
      message,
      confirmButtonText = "Confirm",
      cancelButtonText = "Cancel",
      variant = DEFAULT_VARIANT,
      icon = DEFAULT_ICON,
    }) => {
      const action = await prompt({
        title,
        message,
        primaryButtonText: confirmButtonText,
        secondaryButtonText: cancelButtonText,
        secondaryButtonVariant: "default",
        variant,
        icon,
      });

      return action === ACTIONS.PRIMARY;
    },
    [prompt],
  );

  /**
   * Opens the "Save changes?" dialog shown when the user leaves a form with unsaved changes.
   * @param {Function} onSaveDraft Async function that saves a draft and returns whether it succeeded
   * @param {React.ReactNode} [message] Optional dialog body content
   * @returns {Promise<boolean>} True if the user should proceed (discarded, or saved successfully),
   * false to stay on the form
   */
  const confirmUnsavedChanges = useCallback(
    async (onSaveDraft, message = DEFAULT_UNSAVED_CHANGES_MESSAGE) => {
      const action = await prompt({
        title: "Save changes?",
        message,
        primaryButtonText: "Save draft",
        secondaryButtonText: "Discard draft",
        secondaryButtonVariant: "danger",
        variant: DEFAULT_VARIANT,
        icon: DEFAULT_ICON,
      });

      // Discard draft: proceed without saving
      if (action === ACTIONS.SECONDARY) {
        return true;
      }

      // Save draft: attempt to save a draft, and only proceed if the save was successful
      if (action === ACTIONS.PRIMARY) {
        return Boolean(await onSaveDraft());
      }

      // Close dialog: do not proceed
      return false;
    },
    [prompt],
  );

  const onPrimary = useCallback(() => {
    resolveDialog(ACTIONS.PRIMARY);
  }, [resolveDialog]);

  const onSecondary = useCallback(() => {
    resolveDialog(ACTIONS.SECONDARY);
  }, [resolveDialog]);

  const onClose = useCallback(() => {
    resolveDialog(ACTIONS.CLOSE);
  }, [resolveDialog]);

  useEffect(
    () => () => {
      // Make sure any pending prompt promise is settled if the component unmounts.
      if (resolvePromiseRef.current) {
        resolvePromiseRef.current(ACTIONS.CLOSE);
        resolvePromiseRef.current = null;
      }
    },
    [],
  );

  const props = useMemo(
    () => ({
      ...options,
      isOpen,
      onPrimary,
      onSecondary,
      onClose,
    }),
    [options, isOpen, onPrimary, onSecondary, onClose],
  );

  return useMemo(
    () => ({
      open,
      confirmUnsavedChanges,

      // Export all the component props as one object for convenience
      props,
    }),
    [open, confirmUnsavedChanges, props],
  );
}
