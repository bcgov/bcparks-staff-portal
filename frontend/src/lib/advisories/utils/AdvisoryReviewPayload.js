/**
 * Build the review payload
 * @param {Object} newAdvisoryStatus The effective advisory status after review is complete
 * @param {string} reviewedByName The current user's name (from auth.user?.profile?.name)
 * @param {boolean} isApproving True when HQR transitions to PUB or SCH, false otherwise
 * @returns {Object} Minimal payload containing only fields updated by mark reviewed
 */
export function buildReviewPayload(
  newAdvisoryStatus,
  reviewedByName,
  isApproving = false,
) {
  const reviewedDate = new Date().toISOString();

  // always update reviewedByName and reviewedDate
  const payload = {
    reviewedByName,
    reviewedDate,
  };

  // special cases for transitioning from HQR to PUB or SCH
  if (isApproving) {
    payload.advisoryStatus = newAdvisoryStatus.documentId;

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
