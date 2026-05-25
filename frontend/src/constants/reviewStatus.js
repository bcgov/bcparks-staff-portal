// NEW: Advisories that have never been reviewed (no reviewedAt), the status is either HQR, SCH, or PUB
// UPDATED: Advisories that have never been reviewed (no reviewedAt), but then updated (modifiedDate > createdAt), the status is either HQR or SCH
// EXPIRING: Advisories with an expiryDate within the next week
// EXPIRED: Advisories with an expiryDate in the past, and the status is UNP
// ENDED: Advisories with an endDate in the past
// UNPUBLISHED: Advisories that have been manually unpublished (with unpublishedAt), the status is UNP

export const REVIEW_STATUS = {
  NEW: "New",
  UPDATED: "Updated",
  EXPIRING: "Expiring",
  ENDED: "Ended",
  EXPIRED: "Expired",
  UNPUBLISHED: "Unpublished",
};
