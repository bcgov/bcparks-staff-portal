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
    attributes: ["startDate", "endDate", "adminNote"],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["name"],
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
          {
            model: DateRangeAnnual,
            as: "dateRangeAnnual",
            attributes: ["isDateRangeAnnual"],
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

  const dateRangesToPublish = dateRanges.map((dateRange) => {
    const hasPark = !!dateRange.dateable.park;
    const hasFeature =
      Array.isArray(dateRange.dateable.feature) &&
      dateRange.dateable.feature.length > 0;

    console.log("DATE RANGE PARK", dateRange.dateable?.park.orc);
    console.log("DATE RANGE FEATURE", dateRange.dateable?.feature);

    return {
      isActive: true,
      isDateRangeAnnual: dateRange.dateable.dateRangeAnnual.isDateRangeAnnual,
      operatingYear: dateRange.season.operatingYear,
      startDate: new Date(dateRange.startDate).toISOString().split("T")[0],
      endDate: new Date(dateRange.endDate).toISOString().split("T")[0],
      parkDateType: dateRange.dateType.name,
    protectedArea: hasPark ? dateRange.dateable.park.orcs : null,
    parkFeature: hasFeature ? dateRange.dateable.feature[0].strapiId : null,
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
        console.error(`Error creating date for ${date.dateable.id}`, error);
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
