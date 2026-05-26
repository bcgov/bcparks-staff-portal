import moment from "moment";

/**
 * Maps an array of CMS relation objects to an array of their documentIds.
 * @param {Array|null} items Array of CMS objects with a documentId property, or null
 * @returns {Array<string>} Array of documentId strings
 */
function mapDocumentIds(items) {
  return (items || []).map((item) => item.documentId);
}

/**
 * Build the review payload
 * @param {Object} advisoryData The full advisory record fetched from CMS
 * @param {string} reviewedStatusId The documentId of the reviewed status
 * @param {string} reviewedByName The current user's name (from auth.user?.profile?.name)
 * @returns {Object} The normalized payload ready for cmsPut
 */
export function buildReviewPayload(
  advisoryData,
  reviewedStatusId,
  reviewedByName,
) {
  const reviewedAt = moment().toISOString();

  return {
    title: advisoryData.title,
    description: advisoryData.description,
    revisionNumber: advisoryData.revisionNumber,
    isSafetyRelated: advisoryData.isSafetyRelated,
    listingRank: advisoryData.listingRank,
    note: advisoryData.note,
    submittedBy: advisoryData.submittedBy,
    updatedDate: advisoryData.updatedDate,
    modifiedDate: reviewedAt,
    modifiedBy: reviewedByName,
    modifiedByRole: "approver",
    advisoryDate: advisoryData.advisoryDate,
    effectiveDate: advisoryData.effectiveDate,
    endDate: advisoryData.endDate,
    expiryDate: advisoryData.expiryDate,
    accessStatus: advisoryData.accessStatus?.documentId || null,
    eventType: advisoryData.eventType?.documentId || null,
    urgency: advisoryData.urgency?.documentId || null,
    standardMessages: mapDocumentIds(advisoryData.standardMessages),
    protectedAreas: mapDocumentIds(advisoryData.protectedAreas),
    advisoryStatus: reviewedStatusId,
    links: mapDocumentIds(advisoryData.links),
    regions: mapDocumentIds(advisoryData.regions),
    sections: mapDocumentIds(advisoryData.sections),
    managementAreas: mapDocumentIds(advisoryData.managementAreas),
    sites: mapDocumentIds(advisoryData.sites),
    fireCentres: mapDocumentIds(advisoryData.fireCentres),
    fireZones: mapDocumentIds(advisoryData.fireZones),
    naturalResourceDistricts: mapDocumentIds(
      advisoryData.naturalResourceDistricts,
    ),
    recreationResources: mapDocumentIds(advisoryData.recreationResources),
    isAdvisoryDateDisplayed: advisoryData.isAdvisoryDateDisplayed,
    isEffectiveDateDisplayed: advisoryData.isEffectiveDateDisplayed,
    isEndDateDisplayed: advisoryData.isEndDateDisplayed,
    isUpdatedDateDisplayed: advisoryData.isUpdatedDateDisplayed,
    reviewedByName,
    reviewedAt,
    publishedAt: advisoryData.publishedAt,
    isLatestRevision: advisoryData.isLatestRevision,
  };
}
