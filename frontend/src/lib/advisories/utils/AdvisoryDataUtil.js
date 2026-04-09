import moment from "moment";
import "moment-timezone";

const standardInactiveAdvisoryWindowDays = 30;
const standardInactiveAdvisoryCutoffDate = moment()
  .subtract(standardInactiveAdvisoryWindowDays, "days")
  .format("YYYY-MM-DD");

export function updatePublicAdvisories(publicAdvisories, managementAreas) {
  const today = moment(new Date()).tz("America/Vancouver").toISOString();

  const regionParksCount = managementAreas.reduce((region, item) => {
    region[item.region?.id] =
      (region[item.region?.id] || 0) + item.protectedAreas?.length;
    return region;
  }, {});

  return publicAdvisories.map((publicAdvisory) => {
    publicAdvisory.expired = publicAdvisory.expiryDate < today ? "Y" : "N";
    publicAdvisory.associatedParks =
      publicAdvisory.protectedAreas.map((p) => p.protectedAreaName).join(", ") +
      publicAdvisory.regions.map((r) => r.regionName).join(", ");

    let regionsWithParkCount = [];

    if (publicAdvisory?.regions?.length > 0) {
      publicAdvisory.regions.forEach((region) => {
        region.count = regionParksCount[region.id];
        regionsWithParkCount = [...regionsWithParkCount, region];
      });
      publicAdvisory.regions = regionsWithParkCount;
    }

    publicAdvisory.archived =
      publicAdvisory.advisoryStatus.code === "INA" &&
      publicAdvisory.updatedAt < standardInactiveAdvisoryCutoffDate;

    return publicAdvisory;
  });
}
