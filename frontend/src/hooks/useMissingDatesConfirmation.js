import { useState } from "react";

export function useMissingDatesConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureNames, setFeatureNames] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  function openConfirmation(featureNameList) {
    return new Promise((resolve) => {
      setFeatureNames(featureNameList);
      setResolvePromise(() => resolve); // Store the resolve function
      setIsOpen(true);
    });
  }

  function handleConfirm() {
    if (resolvePromise) {
      resolvePromise({ confirm: true, confirmationMessage: inputMessage }); // Resolve with true
    }
    setIsOpen(false);
  }

  function handleCancel() {
    if (resolvePromise) {
      resolvePromise({ confirm: false, confirmationMessage: inputMessage }); // Resolve with false
    }
    setIsOpen(false);
  }

  return {
    featureNames,
    setFeatureNames,
    inputMessage,
    setInputMessage,

    openConfirmation,
    handleConfirm,
    handleCancel,
    isOpen,
  };
}
