/**
 * Build the unpublish payload
 * @param {Object} advisoryData The full advisory record fetched from CMS
 * @param {string} unpublishedStatusId The documentId of the "Unpublished" status
 * @param {string} modifiedByName The current user's name (from auth.user?.profile?.name)
 * @param {string} modifiedByRole The current user's role ("approver", "submitter" or "contributor")
 * @returns {Object} The normalized payload ready for cmsPut
 */
export function buildUnpublishPayload(
  advisoryData,
  unpublishedStatusId,
  modifiedByName,
  modifiedByRole,
) {
  const payload = {
    unpublishedByName: modifiedByName,
    unpublishedDate: new Date().toISOString(),
    advisoryNumber: advisoryData.advisoryNumber,
    revisionNumber: advisoryData.revisionNumber,
    advisoryStatus: unpublishedStatusId,
    reviewedByName: null,
    reviewedDate: null,
    publishedByName: null,
    publishedDate: null,
  };

  if (modifiedByRole === "approver") {
    payload.reviewedByName = modifiedByName;
    payload.reviewedDate = payload.unpublishedDate;
  }

  return payload;
}
