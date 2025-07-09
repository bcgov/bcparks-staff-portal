import { useEffect } from "react";

// adds a beforeunload event listener to the window
// to prevent navigating away when hasChanges is true

export default function useNavigationGuard(hasChanges) {
  useEffect(() => {
    function handleBeforeUnload(event) {
      if (hasChanges) {
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
