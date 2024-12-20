import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import { removeTrailingSlash } from "@/lib/utils";

export function useNavigationGuard(hasChanges, openConfirmation) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const currentPath = currentLocation.pathname;
    const nextPath = removeTrailingSlash(nextLocation.pathname);

    if (`${currentPath}/preview` === nextPath) {
      return false;
    }
    return hasChanges();
  });

  useEffect(() => {
    async function handleBlocker() {
      if (blocker.state === "blocked") {
        const proceed = await openConfirmation(
          "Discard changes?",
          "Discarded changes will be permanently deleted.",
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

  useEffect(() => {
    async function handleBeforeUnload(e) {
      if (hasChanges()) {
        e.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges, openConfirmation]);
}
