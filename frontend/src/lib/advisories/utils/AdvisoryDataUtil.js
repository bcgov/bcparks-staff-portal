import moment from "moment";
import "moment-timezone";
import { REVIEW_STATUS } from "@/constants/reviewStatus";

const oneWeekDays = 7;

function buildAdvisoryReviewStatuses(publicAdvisory, now) {
  const reviewStatuses = [];
  const oneWeekFromNow = now.clone().add(oneWeekDays, "days");

  const createdAt = moment(publicAdvisory.createdAt);
  const endDate = moment(publicAdvisory.endDate);
  const expiryDate = moment(publicAdvisory.expiryDate);
  const modifiedByName = publicAdvisory.modifiedByName;
  const modifiedDate = moment(publicAdvisory.modifiedDate);
  const reviewedByName = publicAdvisory.reviewedByName;
  const reviewedDate = moment(publicAdvisory.reviewedDate);
  const statusCode = publicAdvisory.advisoryStatus?.code;
  const unpublishedByName = publicAdvisory.unpublishedByName;
  const unpublishedDate = moment(publicAdvisory.unpublishedDate);
  const wasModifiedBySystem = modifiedByName === "system";

  // New advisory, posted and not posted, and not yet reviewed
  const isNew =
    ["HQR", "SCH", "PUB"].includes(statusCode) &&
    createdAt.isValid() &&
    !reviewedDate.isValid() &&
    !reviewedByName;

  // Updated advisory, posted and not posted, and not yet reviewed, but modified after creation
  const isUpdated =
    isNew && modifiedDate.isValid() && modifiedDate.isAfter(createdAt);

  // Expiry date approaching within a week
  const isExpiring =
    expiryDate.isValid() &&
    expiryDate.isBetween(now, oneWeekFromNow, null, "[]");

  // Expired date reached
  const isExpired =
    wasModifiedBySystem &&
    expiryDate.isValid() &&
    expiryDate.isSameOrBefore(now);

  // End date reached
  const isEnded = endDate.isValid() && endDate.isSameOrBefore(now);

  // Unpublished advisory (manually by a user, not by system expiry process)
  const isUnpublished =
    !isExpired &&
    statusCode === "UNP" &&
    unpublishedDate.isValid() &&
    unpublishedByName;

  if (isNew) reviewStatuses.push(REVIEW_STATUS.NEW);
  if (isUpdated) reviewStatuses.push(REVIEW_STATUS.UPDATED);
  if (isExpiring) reviewStatuses.push(REVIEW_STATUS.EXPIRING);
  if (isExpired) reviewStatuses.push(REVIEW_STATUS.EXPIRED);
  if (isEnded) reviewStatuses.push(REVIEW_STATUS.ENDED);
  if (isUnpublished) reviewStatuses.push(REVIEW_STATUS.UNPUBLISHED);

  return reviewStatuses;
}

export function updatePublicAdvisories(publicAdvisories, managementAreas) {
  const now = moment(new Date()).tz("America/Vancouver");
  const today = now.toISOString();

  const regionParksCount = managementAreas.reduce((region, item) => {
    region[item.region?.id] =
      (region[item.region?.id] || 0) + item.protectedAreas?.length;
    return region;
  }, {});

  return publicAdvisories.map((publicAdvisory) => {
    publicAdvisory.expired = publicAdvisory.expiryDate < today ? "Y" : "N";
    publicAdvisory.reviewStatuses = buildAdvisoryReviewStatuses(
      publicAdvisory,
      now,
    );
    // Display associated parks/regions, or rec resource name if no parks/regions
    publicAdvisory.associatedResources =
      publicAdvisory.protectedAreas.map((p) => p.protectedAreaName).join(", ") +
        publicAdvisory.regions.map((r) => r.regionName).join(", ") ||
      publicAdvisory.recreationResources.map((r) => r.resourceName).join(", ") +
        publicAdvisory.recreationResources.map((r) => r.district).join(", ");

    let regionsWithParkCount = [];

    if (publicAdvisory?.regions?.length > 0) {
      publicAdvisory.regions.forEach((region) => {
        region.count = regionParksCount[region.id];
        regionsWithParkCount = [...regionsWithParkCount, region];
      });
      publicAdvisory.regions = regionsWithParkCount;
    }

    return publicAdvisory;
  });
}
