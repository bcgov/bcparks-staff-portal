import { useState } from "react";

export function useMissingDatesConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureNames, setFeatureNames] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  function open(featureNameList) {
    return new Promise((resolve) => {
      setFeatureNames(featureNameList);
      setResolvePromise(() => resolve); // Store the resolve function
      setIsOpen(true);
    });
  }

  function onConfirm() {
    if (resolvePromise) {
      resolvePromise({ confirm: true, message: inputMessage }); // Resolve with true
    }
    setIsOpen(false);
  }

  function onCancel() {
    if (resolvePromise) {
      resolvePromise({ confirm: false, message: inputMessage }); // Resolve with false
    }
    setIsOpen(false);
  }

  return {
    featureNames,
    setFeatureNames,
    inputMessage,
    setInputMessage,

    open,
    onConfirm,
    onCancel,
    isOpen,
  };
}
