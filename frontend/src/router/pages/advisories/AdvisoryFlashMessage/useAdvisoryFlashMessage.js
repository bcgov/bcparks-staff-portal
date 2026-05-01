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
        "Failed to unpublish Advisory / Closure",
        message,
        "error",
      );
    },
    [openUnpublishFlashMessage],
  );

  const openUnpublishSuccess = useCallback(
    (message) => {
      openUnpublishFlashMessage(
        "Unpublished Advisory / Closure",
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
