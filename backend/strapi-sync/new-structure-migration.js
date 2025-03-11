import {
  Season,
  Feature,
  DateRange,
  DateType,
  Dateable,
} from "../models/index.js";

import { post } from "../routes/api/strapi-api.js";

async function getDatesToSend() {
  const dateRanges = await DateRange.findAll({
    attributes: ["startDate", "endDate"],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["name"],
        where: { name: "Winter fee" },
      },
      {
        model: Dateable,
        as: "dateable",
        attributes: ["id"],
        include: [
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
        attributes: ["id", "operatingYear"],
      },
    ],
  });

  const dateRangesToPublish = dateRanges.map((dateRange) => ({
    isActive: true,
    operatingYear: dateRange.season.operatingYear,
    startDate: new Date(dateRange.startDate).toISOString().split("T")[0],
    endDate: new Date(dateRange.endDate).toISOString().split("T")[0],
    dateType: dateRange.dateType.name,
    parkOperationSubArea: dateRange.dateable.feature[0].strapiId,
  }));

  console.log(dateRangesToPublish.length);

  return dateRangesToPublish;
}

async function createParkFeatureDatesInStrapi(dates) {
  // create new records in the strapi API
  const endpoint = "/api/park-feature-dates";

  return Promise.all(
    dates.map(async (date) => {
      try {
        const data = {
          data: date,
        };

        return await post(endpoint, data);
      } catch (error) {
        console.error(
          `Error creating date for featureId ${date.parkOperationSubArea} and year ${date.operatingYear}`,
          error,
        );
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
