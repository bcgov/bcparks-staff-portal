// NEW: Advisories that have never been reviewed (no reviewedDate), the status is either HQR, SCH, or PUB
// UPDATED: Advisories that have never been reviewed (no reviewedDate), but then updated (modifiedDate > createdAt), the status is either HQR, SCH, or PUB
// EXPIRING: Advisories with an expiryDate within the next week
// EXPIRED: Advisories with an expiryDate in the past, and the status is UNP
// ENDED: Advisories with an endDate in the past
// UNPUBLISHED: Advisories that have been manually unpublished (with unpublishedDate), the status is UNP

export const REVIEW_STATUS = {
  NEW: "New",
  UPDATED: "Updated",
  EXPIRING: "Expiring",
  ENDED: "Ended",
  EXPIRED: "Expired",
  UNPUBLISHED: "Unpublished",
};
