// This script populates the Season and DateRange
// based on data from Strapi park-date model with Gate date type.

import "../../env.js";

import {
  Park,
  Season,
  DateRange,
  DateType,
  Publishable,
} from "../../models/index.js";
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";

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
    // get park-date data from Strapi
    const parkDateData = await getStrapiModelData("park-date");

    // build lookup for park by orcs
    const parks = await Park.findAll({ transaction });
    const parkByOrcs = Object.fromEntries(
      parks.map((p) => [String(p.orcs), p]),
    );

    // get dateType "Park gate open"
    const gateDateType = await DateType.findOne({
      where: { strapiDateTypeId: DATE_TYPE.PARK_GATE_OPEN },
      transaction,
    });

    if (!gateDateType) {
      throw new Error('No DateType with name "Park gate open" found.');
    }

    // filter for gate dates that have protectedArea relation
    const gateDates = parkDateData.items.filter((parkDate) => {
      // must have parkDateType with Gate type
      const isGateType =
        parkDate.parkDateType?.dateTypeId === DATE_TYPE.PARK_GATE_OPEN;
      // must have protectedArea relation (not null)
      const hasProtectedArea = parkDate.protectedArea !== null;

      return isGateType && hasProtectedArea;
    });

    console.log(
      `Found ${gateDates.length} Gate dates with protectedArea out of ${parkDateData.items.length} total park-dates`,
    );

    // process each gate date
    for (const gateDate of gateDates) {
      const orcs = gateDate?.protectedArea?.orcs;
      const operatingYear = gateDate?.operatingYear;
      const startDate = gateDate?.startDate;
      const endDate = gateDate?.endDate;

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
          seasonType: SEASON_TYPE.REGULAR,
        },
        defaults: {
          publishableId,
          operatingYear,
          status: "published",
          readyToPublish: true,
        },
        transaction,
      });

      // find or create dateRange for this season and dateType "Park gate open"
      const [dateRange] = await DateRange.findOrCreate({
        where: {
          seasonId: season.id,
          dateTypeId: gateDateType.id,
        },
        defaults: {
          dateableId: park.dateableId,
          seasonId: season.id,
          dateTypeId: gateDateType.id,
          startDate,
          endDate,
        },
        transaction,
      });

      // if dateRange exists but dates differ, update them
      const existingStartDate = new Date(dateRange.startDate);
      const existingEndDate = new Date(dateRange.endDate);
      const newStartDate = new Date(startDate);
      const newEndDate = new Date(endDate);

      if (
        existingStartDate.getTime() !== newStartDate.getTime() ||
        existingEndDate.getTime() !== newEndDate.getTime() ||
        dateRange.dateableId !== park.dateableId
      ) {
        dateRange.startDate = newStartDate;
        dateRange.endDate = newEndDate;
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
