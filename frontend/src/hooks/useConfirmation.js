import { useCallback, useState } from "react";

export default function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmButtonText, setConfirmButtonText] = useState("");
  const [cancelButtonText, setCancelButtonText] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  const open = useCallback(
    (
      title,
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
      notesParam = "",
    ) =>
      new Promise((resolve) => {
        setTitleText(title);
        setMessageText(message);
        setNotes(notesParam);
        setConfirmButtonText(confirmText);
        setCancelButtonText(cancelText);
        setResolvePromise(() => resolve); // Store the resolve function
        setIsOpen(true);
      }),
    [
      setTitleText,
      setMessageText,
      setNotes,
      setConfirmButtonText,
      setCancelButtonText,
      setResolvePromise,
      setIsOpen,
    ],
  );

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
    title: titleText,
    message: messageText,
    confirmButtonText,
    cancelButtonText,
    notes,
    open,
    handleConfirm,
    handleCancel,
    isOpen,
  };
}
