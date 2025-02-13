import { set } from "lodash";
import { useState } from "react";

export function useMissingDatesConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureNames, setFeatureNames] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [resolvePromise, setResolvePromise] = useState(null);

  function openMisingDatesConfirmation(featureNameList) {
    return new Promise((resolve) => {
      setFeatureNames(featureNameList);
      setResolvePromise(() => resolve); // Store the resolve function
      setIsOpen(true);
    });
  }

  function handleMissingDatesConfirm() {
    if (resolvePromise) {
      resolvePromise({ confirm: true, confirmationMessage: inputMessage }); // Resolve with true
    }
    setIsOpen(false);
  }

  function handleMissingDatesCancel() {
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

    openMisingDatesConfirmation,
    handleMissingDatesConfirm,
    handleMissingDatesCancel,
    isMissingDatesConfirmationOpen: isOpen,
  };
}
