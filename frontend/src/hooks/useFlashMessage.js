import { useState } from "react";

export default function useFlashMessage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  // Sets the content and opens the flash message
  function open(titleText, messageText) {
    setTitle(titleText);
    setMessage(messageText);
    setIsOpen(true);
  }

  // Closes the flash message and clears the content
  function close() {
    setIsOpen(false);
    setTitle("");
    setMessage("");
  }

  return {
    title,
    message,
    open,
    close,
    isOpen,
  };
}
