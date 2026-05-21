import { useCallback } from "react";
import moment from "moment";

import { ADVISORY_QUERY } from "@/constants/advisoryQuery";
import { buildReviewPayload } from "@/lib/advisories/utils/AdvisoryReviewPayload";
import useCms from "@/hooks/useCms";

function resolveReviewedStatus(rowData, advisoryStatuses) {
  const publishedStatus = advisoryStatuses.find(
    (status) => status.code === "PUB",
  );
  const scheduledStatus = advisoryStatuses.find(
    (status) => status.code === "SCH",
  );
  const unpublishedStatus = advisoryStatuses.find(
    (status) => status.code === "UNP",
  );

  const statusCode = rowData.advisoryStatus?.code;

  // If the status is currently PUB, keep it PUB but just update the reviewedAt/reviewedBy fields
  if (statusCode === "PUB") {
    return publishedStatus;
  }

  // If the status is currently SCH, keep it SCH but just update the reviewedAt/reviewedBy fields
  if (statusCode === "SCH") {
    return scheduledStatus;
  }

  // If the status is currently UNP, keep it UNP but just update the reviewedAt/reviewedBy fields
  if (statusCode === "UNP") {
    return unpublishedStatus;
  }

  // If the status is currently HQR, set to SCH if future posting date, else PUB
  if (statusCode === "HQR") {
    return moment(rowData.advisoryDate).isAfter(moment())
      ? scheduledStatus
      : publishedStatus;
  }

  // Default - keep the existing status unchanged
  return advisoryStatuses.find((status) => status.code === statusCode);
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
          `public-advisory-audits/${rowData.documentId}?${ADVISORY_QUERY}`,
        );

        await cmsPut(`public-advisory-audits/${rowData.documentId}`, {
          data: buildReviewPayload(
            advisoryData,
            reviewedStatus.documentId,
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
