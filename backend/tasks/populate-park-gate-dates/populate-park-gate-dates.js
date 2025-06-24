// This script populates the Season and DateRange
// based on data from Strapi park-operation-date model.

import "../../env.js";

import { Park, Season, DateRange, DateType } from "../../models/index.js";
import { Op } from "sequelize";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

export async function populateParkGateDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // fetch all models from Strapi
    const strapiData = await fetchAllModels();
    // get park-operation-date data from Strapi
    const parkOperationDateData = getStrapiModelData(
      strapiData,
      "park-operation-date",
    );

    // build lookup for park by orcs
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
    });
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

      if (!park || !park.publishableId) continue;

      // find or create season for this publishableId and operatingYear
      const [season] = await Season.findOrCreate({
        where: {
          publishableId: park.publishableId,
          operatingYear,
        },
        defaults: {
          publishableId: park.publishableId,
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
        dateRange.endDate.getTime() !== new Date(endDate).getTime()
      ) {
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
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
