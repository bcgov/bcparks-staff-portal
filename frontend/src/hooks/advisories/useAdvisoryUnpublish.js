import { useCallback } from "react";

import { ADVISORY_UNPUBLISH_QUERY } from "@/constants/advisoryQuery";
import { buildUnpublishPayload } from "@/lib/advisories/utils/AdvisoryUnpublishPayload";
import useCms from "@/hooks/useCms";

export default function useAdvisoryUnpublish({
  advisoryStatuses,
  modifiedBy,
  isApprover,
  openUnpublishError,
  openUnpublishSuccess,
  onSuccess,
}) {
  const { cmsGet, cmsPut } = useCms();

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
          `public-advisory-audits/${rowData.documentId}?${ADVISORY_UNPUBLISH_QUERY}`,
        );

        await cmsPut(`public-advisory-audits/${rowData.documentId}`, {
          data: buildUnpublishPayload(
            advisoryData,
            unpublishedStatus.documentId,
            modifiedBy,
            isApprover ? "approver" : "submitter",
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
      isApprover,
      modifiedBy,
      onSuccess,
      openUnpublishError,
      openUnpublishSuccess,
    ],
  );
}
