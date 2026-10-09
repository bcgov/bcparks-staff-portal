import { useCallback, useState } from "react";

export default function useFlashMessage() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");

  // Sets the content and opens the flash message
  const open = useCallback((titleText, messageText, options = {}) => {
    setTitle(titleText);
    setMessage(messageText);
    setVariant(options.variant ?? "success");
    setIsOpen(true);
  }, []);

  // Closes the flash message and clears the content
  const close = useCallback(() => {
    setIsOpen(false);
    setTitle("");
    setMessage("");
    setVariant("success");
  }, []);

  return {
    title,
    message,
    variant,
    open,
    close,
    isOpen,
    // Props to be spread onto the FlashMessage component
    props: {
      title,
      message,
      variant,
      isVisible: isOpen,
      onClose: close,
    },
  };
}
