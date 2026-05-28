import { useCallback } from "react";

import { ADVISORY_QUERY } from "@/constants/advisoryQuery";
import { buildUnpublishPayload } from "@/lib/advisories/utils/AdvisoryUnpublishPayload";
import useCms from "@/hooks/useCms";
import useAccess from "@/hooks/useAccess";

export default function useAdvisoryUnpublish({
  advisoryStatuses,
  modifiedByName,
  openUnpublishError,
  openUnpublishSuccess,
  onSuccess,
}) {
  const { cmsGet, cmsPut } = useCms();
  const { getUserAdvisoryRole } = useAccess();

  return useCallback(
    async (rowData) => {
      const unpublishedStatus = advisoryStatuses.find(
        (status) => status.code === "UNP",
      );

      if (!unpublishedStatus?.documentId) {
        openUnpublishError("Could not resolve unpublished advisory status.");
        return;
      }

      try {
        const advisoryData = await cmsGet(
          `public-advisory-audits/${rowData.documentId}?${ADVISORY_QUERY}`,
        );

        await cmsPut(`public-advisory-audits/${rowData.documentId}`, {
          data: buildUnpublishPayload(
            advisoryData,
            unpublishedStatus.documentId,
            modifiedByName,
            getUserAdvisoryRole(),
          ),
        });

        openUnpublishSuccess(`${rowData.title} is no longer publicly posted.`);
        onSuccess();
      } catch (error) {
        console.error("Error unpublishing advisory:", error);
        openUnpublishError(
          `Could not unpublish ${rowData.title}. Please try again.`,
        );
      }
    },
    [
      advisoryStatuses,
      cmsGet,
      cmsPut,
      getUserAdvisoryRole,
      modifiedByName,
      onSuccess,
      openUnpublishError,
      openUnpublishSuccess,
    ],
  );
}
