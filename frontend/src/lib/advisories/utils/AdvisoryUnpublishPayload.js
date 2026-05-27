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
 * Build the unpublish payload
 * @param {Object} advisoryData The full advisory record fetched from CMS
 * @param {string} unpublishedStatusId The documentId of the "Unpublished" status
 * @param {string} modifiedByName The current user's name (from auth.user?.profile?.name)
 * @param {string} modifiedByRole The current user's role ("approver" or "submitter")
 * @returns {Object} The normalized payload ready for cmsPut
 */
export function buildUnpublishPayload(
  advisoryData,
  unpublishedStatusId,
  modifiedByName,
  modifiedByRole,
) {
  const unpublishedDate = moment().toISOString();

  return {
    title: advisoryData.title,
    description: advisoryData.description,
    revisionNumber: advisoryData.revisionNumber,
    isSafetyRelated: advisoryData.isSafetyRelated,
    listingRank: advisoryData.listingRank,
    note: advisoryData.note,
    submittedByName: advisoryData.submittedByName,
    updatedDate: advisoryData.updatedDate,
    modifiedDate: unpublishedDate,
    modifiedByName,
    modifiedByRole,
    advisoryDate: advisoryData.advisoryDate,
    effectiveDate: advisoryData.effectiveDate,
    endDate: advisoryData.endDate,
    expiryDate: advisoryData.expiryDate,
    accessStatus: advisoryData.accessStatus?.documentId || null,
    eventType: advisoryData.eventType?.documentId || null,
    urgency: advisoryData.urgency?.documentId || null,
    standardMessages: mapDocumentIds(advisoryData.standardMessages),
    protectedAreas: mapDocumentIds(advisoryData.protectedAreas),
    advisoryStatus: unpublishedStatusId,
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
    unpublishedByName: modifiedByName,
    unpublishedDate,
    publishedAt: advisoryData.publishedAt,
    isLatestRevision: advisoryData.isLatestRevision,
  };
}
