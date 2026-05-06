import qs from "qs";

export const ADVISORY_UNPUBLISH_QUERY = qs.stringify(
  {
    populate: {
      accessStatus: { populate: "*" },
      advisoryStatus: { populate: "*" },
      eventType: { populate: "*" },
      fireCentres: { fields: ["id"] },
      fireZones: { fields: ["id"] },
      naturalResourceDistricts: { fields: ["id"] },
      recreationResources: { fields: ["id"] },
      links: {
        populate: { type: { populate: "*" }, file: { populate: "*" } },
      },
      urgency: { populate: "*" },
      managementAreas: { fields: ["id"] },
      protectedAreas: { fields: ["id"] },
      regions: { fields: ["id"] },
      sections: { fields: ["id"] },
      sites: { fields: ["id"] },
      standardMessages: { populate: "*" },
    },
  },
  {
    encodeValuesOnly: true,
  },
);
