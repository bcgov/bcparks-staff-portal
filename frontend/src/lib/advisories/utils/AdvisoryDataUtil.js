import moment from "moment";
import "moment-timezone";
import { REVIEW_STATUS } from "@/constants/reviewStatus";

const oneWeekDays = 7;
const standardInactiveAdvisoryWindowDays = 30;
const standardInactiveAdvisoryCutoffDate = moment()
  .subtract(standardInactiveAdvisoryWindowDays, "days")
  .format("YYYY-MM-DD");

function buildAdvisoryReviewStatuses(publicAdvisory, now) {
  const reviewStatuses = [];
  const reviewedByName = publicAdvisory.reviewedByName;
  const unpublishedByName = publicAdvisory.unpublishedByName;
  const statusCode = publicAdvisory.advisoryStatus?.code;
  const createdAt = moment(publicAdvisory.createdAt);
  const reviewedAt = moment(publicAdvisory.reviewedAt);
  const unpublishedAt = moment(publicAdvisory.unpublishedAt);
  const modifiedDate = moment(publicAdvisory.modifiedDate);
  const expiryDate = moment(publicAdvisory.expiryDate);
  const endDate = moment(publicAdvisory.endDate);
  const oneWeekFromNow = now.clone().add(oneWeekDays, "days");

  // New advisory, posted and not posted within a week, and not yet reviewed
  const isNew =
    ["HQR", "SCH", "PUB"].includes(statusCode) &&
    createdAt.isValid() &&
    !reviewedAt.isValid() &&
    !reviewedByName;

  // Updated advisory, not posted
  const isUpdated =
    ["HQR", "SCH"].includes(statusCode) &&
    modifiedDate.isValid() &&
    modifiedDate.isAfter(createdAt);

  // Expiry date approaching within a week
  const isExpiring =
    expiryDate.isValid() &&
    expiryDate.isBetween(now, oneWeekFromNow, null, "[]");

  // Expired date reached
  const isExpired = expiryDate.isValid() && expiryDate.isSameOrBefore(now);

  // End date reached
  const isEnded = endDate.isValid() && endDate.isSameOrBefore(now);

  // Unpublished advisory (manually)
  const isUnpublished =
    statusCode === "UNP" &&
    unpublishedAt.isValid() &&
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

    publicAdvisory.archived =
      publicAdvisory.advisoryStatus.code === "UNP" &&
      publicAdvisory.updatedAt < standardInactiveAdvisoryCutoffDate;

    return publicAdvisory;
  });
}
