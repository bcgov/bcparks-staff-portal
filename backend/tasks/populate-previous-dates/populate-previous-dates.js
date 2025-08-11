// This script populates the Season and DateRange
// based on data from a JSON file containing previous dates.

import "../../env.js";

import fs from "node:fs";
import path from "node:path";
import _ from "lodash";
import { Op } from "sequelize";
import { Park, Season, DateRange, DateType } from "../../models/index.js";

const jsonPath = path.join(import.meta.dirname, "previous-dates.json");
const dateData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

export async function populatePreviousDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // build lookup for parks by orcs
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
    });
    const parkByOrcs = _.keyBy(parks, (park) => String(park.orcs));

    for (const entry of dateData) {
      const { orcs, operatingYear, dateType, startDate, endDate } = entry;

      if (!orcs || !operatingYear || !dateType || !startDate || !endDate)
        continue;

      const park = parkByOrcs[orcs];

      if (!park || !park.publishableId) continue;

      // find or create Season
      let season = await Season.findOne({
        where: {
          publishableId: park.publishableId,
          operatingYear,
        },
        transaction,
      });

      if (!season) {
        season = await Season.create(
          {
            publishableId: park.publishableId,
            operatingYear,
            status: "requested",
            readyToPublish: true,
            seasonType: "regular",
          },
          { transaction },
        );
      } else {
        // update status, readyToPublish, seasonType
        season.status = "requested";
        season.readyToPublish = true;
        season.seasonType = "regular";
        await season.save({ transaction });
      }

      // find DateType by name and parkLevel
      const dateTypeObj = await DateType.findOne({
        where: {
          name: dateType,
          parkLevel: true,
        },
        transaction,
      });

      if (!dateTypeObj) continue;

      // find or create DateRange
      let dateRange = await DateRange.findOne({
        where: {
          seasonId: season.id,
          dateTypeId: dateTypeObj.id,
        },
        transaction,
      });

      if (!dateRange) {
        dateRange = await DateRange.create(
          {
            dateableId: park.dateableId,
            seasonId: season.id,
            dateTypeId: dateTypeObj.id,
            startDate,
            endDate,
          },
          { transaction },
        );
      } else {
        // update startDate, endDate, dateableId
        dateRange.dateableId = park.dateableId;
        dateRange.startDate = new Date(startDate);
        dateRange.endDate = new Date(endDate);
        await dateRange.save({ transaction });
      }

      console.log(
        `Populated DateRange ${dateRange.startDate} to ${dateRange.endDate} for Park orcs ${park.orcs}`,
      );
    }

    await transaction.commit();
    console.log("Season and DateRange population from JSON complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error populating Season and DateRange from JSON:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populatePreviousDates().catch((err) => {
    console.error("Failed to populate Season and DateRange from JSON:", err);
    throw err;
  });
}
