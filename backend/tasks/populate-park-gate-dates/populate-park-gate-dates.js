// This script populates the Season and DateRange
// based on data from Strapi park-operation-date model.

import "../../env.js";

import {
  Park,
  Season,
  DateRange,
  DateType,
  Publishable,
} from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";

async function createPublishableForPark(park, transaction) {
  if (park.publishableId) return park.publishableId;
  // create a new Publishable record
  const publishable = await Publishable.create({}, { transaction });

  // update the park with the new publishableId
  park.publishableId = publishable.id;
  await park.save({ transaction });

  return publishable.id;
}

export async function populateParkGateDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // get park-operation-date data from Strapi
    const parkOperationDateData = await getStrapiModelData(
      "park-operation-date",
    );

    // build lookup for park by orcs
    const parks = await Park.findAll({ transaction });
    const parkByOrcs = Object.fromEntries(
      parks.map((p) => [String(p.orcs), p]),
    );

    // get dateType "Operating"
    const operatingDateType = await DateType.findOne({
      where: { name: "Operating", parkLevel: true },
      transaction,
    });

    if (!operatingDateType) {
      throw new Error('No DateType with name "Operating" found.');
    }

    // group park-operation-date items by orcs and operatingYear
    for (const operationDate of parkOperationDateData.items) {
      const orcs =
        operationDate.attributes?.protectedArea?.data?.attributes?.orcs;
      const operatingYear = operationDate.attributes?.operatingYear;
      const startDate = operationDate.attributes?.gateOpenDate;
      const endDate = operationDate.attributes?.gateCloseDate;

      if (!orcs || !operatingYear || !startDate || !endDate) continue;

      const park = parkByOrcs[String(orcs)];

      if (!park) continue;

      // ensure park has a publishableId (create one if needed)
      const publishableId = await createPublishableForPark(park, transaction);

      // find or create season for this publishableId and operatingYear
      const [season] = await Season.findOrCreate({
        where: {
          publishableId,
          operatingYear,
        },
        defaults: {
          publishableId,
          operatingYear,
          status: "published",
          readyToPublish: true,
        },
        transaction,
      });

      // find or create dateRange for this season and dateType "Operating"
      const [dateRange] = await DateRange.findOrCreate({
        where: {
          seasonId: season.id,
          dateTypeId: operatingDateType.id,
        },
        defaults: {
          dateableId: park.dateableId,
          seasonId: season.id,
          dateTypeId: operatingDateType.id,
          startDate,
          endDate,
        },
        transaction,
      });

      // if dateRange exists but dates differ, update them
      if (
        dateRange.startDate.getTime() !== new Date(startDate).getTime() ||
        dateRange.endDate.getTime() !== new Date(endDate).getTime() ||
        dateRange.dateableId !== park.dateableId
      ) {
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
        dateRange.dateableId = park.dateableId;
        await dateRange.save({ transaction });
      }
    }

    await transaction.commit();
    console.log("Season and DateRange population complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error populating Season and DateRange:", err);
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populateParkGateDates().catch((err) => {
    console.error("Failed to populate Season and DateRange:", err);
    throw err;
  });
}
