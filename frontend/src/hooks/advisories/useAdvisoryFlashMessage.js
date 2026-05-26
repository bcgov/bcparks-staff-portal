import { useCallback, useState } from "react";

export default function useAdvisoryFlashMessage() {
  const [unpublishFlashMessage, setUnpublishFlashMessage] = useState({
    isVisible: false,
    title: "",
    message: "",
    variant: "success",
  });

  const closeUnpublishFlashMessage = useCallback(() => {
    setUnpublishFlashMessage((current) => ({
      ...current,
      isVisible: false,
    }));
  }, []);

  const openUnpublishFlashMessage = useCallback(
    (title, message, variant = "success") => {
      setUnpublishFlashMessage({
        isVisible: true,
        title,
        message,
        variant,
      });
    },
    [],
  );

  const openUnpublishError = useCallback(
    (message) => {
      openUnpublishFlashMessage(
        "Failed to unpublish advisory / closure",
        message,
        "error",
      );
    },
    [openUnpublishFlashMessage],
  );

  const openUnpublishSuccess = useCallback(
    (message) => {
      openUnpublishFlashMessage(
        "Unpublished advisory / closure",
        message,
        "success",
      );
    },
    [openUnpublishFlashMessage],
  );

  return {
    unpublishFlashMessage,
    closeUnpublishFlashMessage,
    openUnpublishError,
    openUnpublishSuccess,
  };
}
