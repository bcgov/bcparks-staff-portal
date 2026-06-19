import { useEffect, useRef } from "react";

// Prevent navigation away when hasChanges is true.
// This hook prevents browser-level unloads (back button, tab close, reload)
// by showing the browser's native leave-page dialog. (`beforeunload` event handler)
// It also exposes a ref that indicates when this native dialog is active,
// so the nav blocker can suppress the in-app modal and let the browser prompt own that attempt.

export default function useNavigationGuard(hasChanges) {
  // Ref to track when a browser-level unload attempt is in progress.
  // Used by callers (e.g., useBlocker) to suppress the in-app modal when
  // the native browser prompt is already handling the navigation decision.
  const isBrowserUnloadActiveRef = useRef(false);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (hasChanges) {
        // Set the flag so the nav blocker knows a native unload is active.
        // This happens synchronously before the browser shows its leave-page dialog.
        isBrowserUnloadActiveRef.current = true;

        // Prevent the default unload, which tells the browser to show its native dialog.
        event.preventDefault();

        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = "";
      }
    }

    // When the user cancels the browser dialog and stays on the page,
    // the window receives a `focus` event. Clear the flag so the next
    // internal navigation can use the in-app modal again.
    function handleFocusAfterCancel() {
      if (isBrowserUnloadActiveRef.current) {
        isBrowserUnloadActiveRef.current = false;
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("focus", handleFocusAfterCancel);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("focus", handleFocusAfterCancel);
    };
  }, [hasChanges]);

  return {
    isBrowserUnloadActiveRef,
  };
}
