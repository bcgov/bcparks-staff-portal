/**
 * Build the review payload
 * @param {string} reviewedStatusCode The code of the reviewed status
 * @param {string} reviewedStatusDocumentId The documentId of the reviewed status
 * @param {string} reviewedByName The current user's name (from auth.user?.profile?.name)
 * @param {boolean} isApproving True when HQR transitions to PUB or SCH, false otherwise
 * @returns {Object} Minimal payload containing only fields updated by mark reviewed
 */
export function buildReviewPayload(
  reviewedStatusCode,
  reviewedStatusDocumentId,
  reviewedByName,
  isApproving = false,
) {
  const reviewedDate = new Date().toISOString();
  const payload = {
    reviewedByName,
    reviewedDate,
  };

  if (isApproving) {
    payload.advisoryStatus = reviewedStatusDocumentId;

    if (reviewedStatusCode === "PUB") {
      payload.publishedByName = reviewedByName;
      payload.publishedDate = reviewedDate;
    }
    if (reviewedStatusCode === "SCH") {
      payload.modifiedByName = reviewedByName;
      payload.modifiedDate = reviewedDate;
    }
  }

  return payload;
}
