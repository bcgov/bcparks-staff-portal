import { useState } from "react";

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmButtonText, setConfirmButtonText] = useState("");
  const [cancelButtonText, setCancelButtonText] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  function openConfirmation(
    confirmationTitle,
    confirmationMessage,
    confirmText = "Confirm",
    cancelText = "Cancel",
    notesParam = "",
  ) {
    return new Promise((resolve) => {
      setTitle(confirmationTitle);
      setMessage(confirmationMessage);
      setNotes(notesParam);
      setConfirmButtonText(confirmText);
      setCancelButtonText(cancelText);
      setResolvePromise(() => resolve); // Store the resolve function
      setIsOpen(true);
    });
  }

  function handleConfirm() {
    if (resolvePromise) {
      resolvePromise(true); // Resolve with true
    }
    setIsOpen(false);
  }

  function handleCancel() {
    if (resolvePromise) {
      resolvePromise(false); // Resolve with false
    }
    setIsOpen(false);
  }

  return {
    title,
    message,
    confirmButtonText,
    cancelButtonText,
    confirmationDialogNotes: notes,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen: isOpen,
  };
}
