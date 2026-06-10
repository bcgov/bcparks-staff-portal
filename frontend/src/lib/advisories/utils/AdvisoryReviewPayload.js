/**
 * Build the review payload
 * @param {Object} newAdvisoryStatus The effective advisory status after review is complete
 * @param {string} reviewedByName The current user's name (from auth.user?.profile?.name)
 * @param {number} advisoryNumber The advisory number
 * @param {number} revisionNumber The revision number
 * @param {boolean} isApproving True when HQR transitions to PUB or SCH, false otherwise
 * @returns {Object} Payload containing fields updated by mark reviewed plus identifiers needed by middleware
 */
export function buildReviewPayload(
  newAdvisoryStatus,
  reviewedByName,
  advisoryNumber,
  revisionNumber,
  isApproving = false,
) {
  const reviewedDate = new Date().toISOString();

  // always update reviewedByName and reviewedDate
  const payload = {
    reviewedByName,
    reviewedDate,
    advisoryStatus: newAdvisoryStatus.documentId,
    advisoryNumber,
    revisionNumber,
  };

  // special cases for transitioning from HQR to PUB or SCH
  if (isApproving) {
    if (newAdvisoryStatus.code === "PUB") {
      payload.publishedByName = reviewedByName;
      payload.publishedDate = reviewedDate;
    }
    if (newAdvisoryStatus.code === "SCH") {
      payload.modifiedByName = reviewedByName;
      payload.modifiedDate = reviewedDate;
    }
  }

  return payload;
}
