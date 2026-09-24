import { useCallback, useEffect, useRef, useState } from "react";

const ACTIONS = {
  DISCARD: "discard",
  SAVE: "save",
  CLOSE: "close",
};

/*
 Hook for managing the "Unsaved changes" dialog component,
 which is shown when the user attempts to navigate away with unsaved changes
*/

export default function useUnsavedChangesDialog(onSaveDraft) {
  // Visibility state for the dialog
  const [isOpen, setIsOpen] = useState(false);

  // Ref to track whether the dialog is currently open to prevent multiple prompts from stacking
  const isOpenRef = useRef(false);

  // Ref to hold the resolve function of the current dialog promise, so it can be resolved by the dialog's action buttons
  const resolvePromiseRef = useRef(null);

  // Resolves whichever action the user chose and resets the dialog state
  // so the next blocked navigation can open a fresh prompt.
  const resolveDialog = useCallback((action) => {
    const resolve = resolvePromiseRef.current;

    resolvePromiseRef.current = null;
    isOpenRef.current = false;
    setIsOpen(false);

    if (resolve) {
      resolve(action);
    }
  }, []);

  // Opens the dialog and returns a promise that resolves when the user chooses
  // save, discard, or close.
  const open = useCallback(async () => {
    if (isOpenRef.current) {
      return ACTIONS.CLOSE;
    }

    isOpenRef.current = true;
    setIsOpen(true);

    return new Promise((resolve) => {
      resolvePromiseRef.current = resolve;
    });
  }, []);

  // Waits for the user's choice and converts it into a simple navigation
  // decision for the caller.
  // Returns true when navigation should proceed, or false to stay on the form.
  const confirmNavigation = useCallback(async () => {
    const action = await open();

    // Discard draft: proceed with the blocked navigation without saving
    if (action === ACTIONS.DISCARD) {
      return true;
    }

    // Save draft: attempt to save a draft, and only proceed if the save was successful
    if (action === ACTIONS.SAVE) {
      return Boolean(await onSaveDraft());
    }

    // Close dialog: do not proceed with navigation
    return false;
  }, [onSaveDraft, open]);

  // Handles closing the dialog without saving or discarding.
  // Just resolves the dialog promise as a "close" action and stays on the form.
  const handleClose = useCallback(() => {
    resolveDialog(ACTIONS.CLOSE);
  }, [resolveDialog]);

  // Handles closing the dialog and discarding changes.
  // Resolves the dialog promise as a "discard" action.
  const handleDiscard = useCallback(() => {
    resolveDialog(ACTIONS.DISCARD);
  }, [resolveDialog]);

  // Handles closing the "Unsaved changes" dialog and saving a draft.
  // Resolves the dialog promise as a "save" action.
  const handleSaveDraft = useCallback(() => {
    resolveDialog(ACTIONS.SAVE);
  }, [resolveDialog]);

  useEffect(
    () => () => {
      // Make sure any pending prompt promise is settled if the page unmounts.
      if (resolvePromiseRef.current) {
        resolvePromiseRef.current(ACTIONS.CLOSE);
        resolvePromiseRef.current = null;
      }
    },
    [],
  );

  return {
    confirmNavigation,
    props: {
      isOpen,
      onClose: handleClose,
      onDiscard: handleDiscard,
      onSaveDraft: handleSaveDraft,
    },
  };
}
