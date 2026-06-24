import { useEffect } from "react";

// Prevent document-level unloads when hasChanges resolves to true.
// This hook handles native browser prompts for reload/tab close/external document navigation.

export default function useNavigationGuard(hasChanges) {
  useEffect(() => {
    function handleBeforeUnload(event) {
      if (typeof hasChanges === "function" ? hasChanges() : !!hasChanges) {
        // Prevent the default unload, which tells the browser to show its native dialog.
        event.preventDefault();

        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);
}
