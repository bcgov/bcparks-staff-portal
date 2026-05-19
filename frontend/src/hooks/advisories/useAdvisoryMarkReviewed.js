import { useCallback } from "react";
import moment from "moment";

import { ADVISORY_UNPUBLISH_QUERY } from "@/constants/advisoryQuery";
import useCms from "@/hooks/useCms";
import { buildReviewPayload } from "@/lib/advisories/utils/AdvisoryReviewPayload";

function resolveReviewedStatus(rowData, advisoryStatuses) {
  const publishedStatus = advisoryStatuses.find(
    (status) => status.code === "PUB",
  );
  const scheduledStatus = advisoryStatuses.find(
    (status) => status.code === "SCH",
  );

  if (rowData.advisoryStatus?.code === "PUB") {
    return publishedStatus;
  }

  return moment(rowData.advisoryDate).isAfter(moment())
    ? scheduledStatus
    : publishedStatus;
}

export default function useAdvisoryMarkReviewed({
  advisoryStatuses,
  reviewedByName,
  isApprover,
  openMarkReviewedError,
  openMarkReviewedSuccess,
  onSuccess,
}) {
  const { cmsGet, cmsPut } = useCms();

  return useCallback(
    async (rowData) => {
      const reviewedStatus = resolveReviewedStatus(rowData, advisoryStatuses);

      if (!reviewedStatus?.documentId) {
        openMarkReviewedError(
          "Could not resolve the status for the reviewed advisory.",
        );
        return;
      }

      try {
        const advisoryData = await cmsGet(
          `public-advisory-audits/${rowData.documentId}?${ADVISORY_UNPUBLISH_QUERY}`,
        );

        await cmsPut(`public-advisory-audits/${rowData.documentId}`, {
          data: buildReviewPayload(
            advisoryData,
            reviewedStatus.documentId,
            reviewedStatus.code,
            reviewedByName,
            isApprover ? "approver" : "submitter",
          ),
        });

        openMarkReviewedSuccess(`${rowData.title} was marked as reviewed.`);
        onSuccess();
      } catch (error) {
        console.error("Error marking advisory as reviewed:", error);
        openMarkReviewedError(
          `Could not mark ${rowData.title} as reviewed. Please try again.`,
        );
      }
    },
    [
      advisoryStatuses,
      cmsGet,
      cmsPut,
      isApprover,
      reviewedByName,
      onSuccess,
      openMarkReviewedError,
      openMarkReviewedSuccess,
    ],
  );
}
