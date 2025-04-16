import { useEffect, useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { removeTrailingSlash } from "@/lib/utils";

export function useNavigationGuard(hasChanges, openConfirmation) {
  const blocker = useBlocker(({ nextLocation }) => {
    const nextPath = removeTrailingSlash(nextLocation.pathname);

    // Get query string from nextPath
    const queryString = new URLSearchParams(nextLocation.search);

    // Bypass the blocker when saving or approving
    if (
      nextPath.includes("/preview") ||
      nextPath.includes("/edit") ||
      queryString.has("approved") ||
      queryString.has("saved")
    ) {
      return false;
    }
    return hasChanges;
  });

  useEffect(() => {
    async function handleBlocker() {
      if (blocker.state === "blocked") {
        const proceed = await openConfirmation(
          "Discard changes?",
          "Discarded changes will be permanently deleted.",
          "Discard changes",
          "Continue editing",
        );

        if (proceed) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }
    }

    handleBlocker();
  }, [blocker, openConfirmation]);

  const handleBeforeUnload = useCallback(
    async (e) => {
      if (hasChanges) {
        e.preventDefault();
      }
    },
    [hasChanges],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleBeforeUnload]);
}
