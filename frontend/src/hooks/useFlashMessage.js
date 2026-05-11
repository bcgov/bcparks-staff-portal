import { useState } from "react";

export default function useFlashMessage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");

  // Sets the content and opens the flash message
  function open(titleText, messageText, options = {}) {
    setTitle(titleText);
    setMessage(messageText);
    setVariant(options.variant ?? "success");
    setIsOpen(true);
  }

  // Closes the flash message and clears the content
  function close() {
    setIsOpen(false);
    setTitle("");
    setMessage("");
    setVariant("success");
  }

  return {
    title,
    message,
    variant,
    open,
    close,
    isOpen,
  };
}
