import moment from "moment";

function mapDocumentIds(items) {
  return (items || []).map((item) => item.documentId);
}

export function buildReviewPayload(
  advisoryData,
  reviewedStatusId,
  reviewedStatusCode,
  reviewedByName,
  modifiedByRole,
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
    publishedAt:
      advisoryData.publishedAt ||
      (["PUB", "SCH"].includes(reviewedStatusCode) ? reviewedAt : null),
    isLatestRevision: advisoryData.isLatestRevision,
    reviewedByName,
    reviewedAt,
  };
}
