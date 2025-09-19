import {
  Dateable,
  DateRange,
  DateRangeAnnual,
  DateType,
  Feature,
  Park,
  Season,
} from "../../models/index.js";
import { post } from "../../routes/api/strapi-api.js";

// Run once to migrate DateRange, Season, and DateRangeAnnual from doot to strapi park-dates
async function getDatesToSend() {
  const dateRanges = await DateRange.findAll({
    attributes: ["startDate", "endDate", "adminNote", "dateableId"],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "name"],
      },
      {
        model: Dateable,
        as: "dateable",
        attributes: ["id"],
        include: [
          {
            model: Park,
            as: "park",
            attributes: ["id", "name", "orcs"],
          },
          {
            model: Feature,
            as: "feature",
            attributes: ["id", "name", "strapiId"],
          },
        ],
      },
      {
        model: Season,
        as: "season",
        attributes: ["id", "operatingYear", "status"],
        where: { status: "published" },
      },
    ],
  });

  // Fetch all DateRangeAnnuals
  const dateRangeAnnuals = await DateRangeAnnual.findAll({
    attributes: ["dateableId", "dateTypeId", "isDateRangeAnnual"],
  });

  // Build a lookup map for fast access
  const annualMap = new Map();

  dateRangeAnnuals.forEach((annual) => {
    annualMap.set(
      `${annual.dateableId}_${annual.dateTypeId}`,
      annual.isDateRangeAnnual,
    );
  });

  const dateRangesToPublish = dateRanges.map((dateRange) => {
    const hasPark = dateRange.dateable?.park;
    const hasFeature = dateRange.dateable?.feature;
    const parkId = hasPark ? dateRange.dateable.park.orcs : null;
    const featureId = hasFeature ? dateRange.dateable.feature.strapiId : null;

    // Find matching DateRangeAnnual
    const annualKey = `${dateRange.dateableId}_${dateRange.dateType.id}`;
    const isDateRangeAnnual = annualMap.get(annualKey) ?? false;

    return {
      dateable: dateRange.dateableId,
      isActive: true,
      isDateRangeAnnual,
      operatingYear: dateRange.season.operatingYear,
      startDate: new Date(dateRange.startDate).toISOString().split("T")[0],
      endDate: new Date(dateRange.endDate).toISOString().split("T")[0],
      parkDateType: dateRange.dateType.name,
      protectedArea: parkId,
      parkFeature: featureId,
      adminNote: dateRange.adminNote,
    };
  });

  return dateRangesToPublish;
}

// create new records in the strapi API
async function createParkFeatureDatesInStrapi(dates) {
  const endpoint = "/api/park-dates";

  return Promise.all(
    dates.map(async (date) => {
      try {
        const data = {
          data: date,
        };

        return await post(endpoint, data);
      } catch (error) {
        console.error(
          `Error creating date for dateable ${date.dateable}:`,
          error.response?.data || error.message,
        );
        console.error("Payload was:", JSON.stringify(date, null, 2));
        return null;
      }
    }),
  );
}

async function migrate() {
  const dates = await getDatesToSend();

  await createParkFeatureDatesInStrapi(dates);
}

migrate();
