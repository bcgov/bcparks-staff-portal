import { useCallback } from "react";
import { isFuture, isValid, parseISO } from "date-fns";

import { buildReviewPayload } from "@/apps/advisories/utils/advisoryReviewPayload";
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

  // If the status is currently PUB, keep it PUB but just update the reviewedDate/reviewedByName fields
  if (statusCode === "PUB") {
    return publishedStatus;
  }

  // If the status is currently SCH, keep it SCH but just update the reviewedDate/reviewedByName fields
  if (statusCode === "SCH") {
    return scheduledStatus;
  }

  // If the status is currently UNP, keep it UNP but just update the reviewedDate/reviewedByName fields
  if (statusCode === "UNP") {
    return unpublishedStatus;
  }

  // If the status is currently HQR, set to SCH if future posting date, else PUB
  if (statusCode === "HQR") {
    const advisoryDate = parseISO(rowData.advisoryDate);

    return isValid(advisoryDate) && isFuture(advisoryDate)
      ? scheduledStatus
      : publishedStatus;
  }

  // Default - keep the existing status unchanged
  return advisoryStatuses.find((status) => status.code === statusCode);
}

/**
 * Checks whether the advisory's expiry date is now or in the past.
 * Mirrors the CMS advisory status logic, which unpublishes expired advisories.
 * @param {Object} rowData The advisory data
 * @param {string|null} rowData.expiryDate The ISO expiry date, if any
 * @returns {boolean} True if the advisory has a valid expiry date that has passed
 */
function isExpired(rowData) {
  if (!rowData.expiryDate) return false;

  const expiryDate = parseISO(rowData.expiryDate);

  return isValid(expiryDate) && expiryDate <= new Date();
}

export default function useAdvisoryMarkReviewed({
  advisoryStatuses,
  reviewedByName,
  openMarkReviewedError,
  openMarkReviewedSuccess,
  onSuccess,
}) {
  const { cmsPut } = useCms();

  return useCallback(
    async (rowData) => {
      const reviewedStatus = resolveReviewedStatus(rowData, advisoryStatuses);
      const isApproving = rowData.advisoryStatus?.code === "HQR";

      // Don't publish an advisory that has already expired
      if (isApproving && isExpired(rowData)) {
        openMarkReviewedError(
          `${rowData.title} has an expiry date in the past. Enter a future date.`,
        );
        return;
      }

      if (!reviewedStatus) {
        openMarkReviewedError(
          "Could not resolve the new status for the reviewed advisory.",
        );
        return;
      }

      try {
        await cmsPut(`public-advisory-audits/${rowData.documentId}`, {
          data: buildReviewPayload(
            reviewedStatus,
            reviewedByName,
            rowData.advisoryNumber,
            rowData.revisionNumber,
            isApproving,
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
      cmsPut,
      reviewedByName,
      onSuccess,
      openMarkReviewedError,
      openMarkReviewedSuccess,
    ],
  );
}
