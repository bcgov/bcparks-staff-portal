import { useState } from "react";

export function useFlashMessage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  function openFlashMessage(confirmationTitle, confirmationMessage) {
    setTitle(confirmationTitle);
    setMessage(confirmationMessage);
    setIsOpen(true);
  }

  function handleFlashClose() {
    setIsOpen(false);
  }

  return {
    flashTitle: title,
    flashMessage: message,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen: isOpen,
  };
}
