import { useState } from "react";

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");

  function openConfirmation(
    confirmationTitle,
    confirmationMessage,
    action,
    notesParam = "",
  ) {
    setTitle(confirmationTitle);
    setMessage(confirmationMessage);
    setNotes(notesParam);
    setConfirmAction(() => action);
    setIsOpen(true);
  }

  function handleConfirm() {
    if (confirmAction) {
      confirmAction();
    }
    setIsOpen(false);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  return {
    title,
    message,
    confirmationDialogNotes: notes,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen: isOpen,
  };
}
