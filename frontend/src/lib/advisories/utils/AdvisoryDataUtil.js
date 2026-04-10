import { cmsAxios } from "@/lib/advisories/axios_config";
import moment from "moment";
import "moment-timezone";
import qs from "qs";

const standardInactiveAdvisoryWindowDays = 30;
const standardInactiveAdvisoryCutoffDate = moment()
  .subtract(standardInactiveAdvisoryWindowDays, "days")
  .format("YYYY-MM-DD");
const extendedInactiveAdvisoryCutoffDate = moment().subtract(18, "months").format("YYYY-MM-DD");

export function getLatestPublicAdvisoryAudits(keycloakToken, showArchived) {
  const advisoryFilter = showArchived
    ? {
        $or: [
          { advisoryStatus: { code: { $ne: "INA" } } },
          {
            updatedAt: {
              $gt: extendedInactiveAdvisoryCutoffDate,
            },
          },
        ],
      }
    : {
        $or: [
          { advisoryStatus: { code: { $ne: "INA" } } },
          { updatedAt: { $gt: standardInactiveAdvisoryCutoffDate } },
        ],
      };

  const query = qs.stringify(
    {
      fields: [
        "advisoryNumber",
        "advisoryDate",
        "title",
        "effectiveDate",
        "endDate",
        "expiryDate",
        "updatedAt",
      ],
      populate: {
        protectedAreas: {
          fields: ["orcs", "protectedAreaName"],
        },
        advisoryStatus: {
          fields: ["advisoryStatus", "code"],
        },
        eventType: {
          fields: ["eventType"],
        },
        urgency: {
          fields: ["urgency"],
        },
        regions: {
          fields: ["regionName"],
        },
      },
      filters: {
        $and: [{ isLatestRevision: true }, advisoryFilter],
      },
      pagination: {
        limit: 2000,
      },
      sort: ["advisoryDate:DESC"],
    },
    {
      encodeValuesOnly: true,
    },
  );

  return cmsAxios.get(`public-advisory-audits?${query}`, {
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
    },
  });
}

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
