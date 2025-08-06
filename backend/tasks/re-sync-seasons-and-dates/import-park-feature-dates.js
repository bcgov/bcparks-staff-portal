// This script imports park-feature-dates from Strapi into Season and DateRange.

import "../../env.js";

import {
  ParkArea,
  Feature,
  Season,
  DateRange,
  DateType,
} from "../../models/index.js";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

export async function importParkFeatureDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // fetch all models from Strapi
    const strapiData = await fetchAllModels();
    // get park-feature-dates data from Strapi
    const featureDatesData = getStrapiModelData(
      strapiData,
      "park-feature-date",
    );

    // get all features and park areas for lookup
    const features = await Feature.findAll({ transaction });
    const featureByStrapiId = Object.fromEntries(
      features.map((feature) => [String(feature.strapiId), feature]),
    );
    const parkAreas = await ParkArea.findAll({ transaction });
    const parkAreaById = Object.fromEntries(
      parkAreas.map((parkArea) => [String(parkArea.id), parkArea]),
    );

    // get all DateTypes for lookup by name
    const dateTypes = await DateType.findAll({ transaction });
    const dateTypeByName = Object.fromEntries(
      dateTypes.map((dateType) => [dateType.name, dateType]),
    );

    const currentYear = new Date().getFullYear();

    for (const featureDate of featureDatesData.items) {
      if (!featureDate.isActive) continue;

      const operatingYear = featureDate.operatingYear;
      const subArea = featureDate.parkOperationSubArea;

      if (!subArea) continue;

      // find Feature by Strapi ID
      const feature = featureByStrapiId[String(subArea.id)];
      let publishableId = null;

      if (feature && feature.publishableId) {
        publishableId = feature.publishableId;
      } else if (feature && feature.parkAreaId) {
        const parkArea = parkAreaById[String(feature.parkAreaId)];

        if (parkArea && parkArea.publishableId) {
          publishableId = parkArea.publishableId;
        }
      }
      if (!publishableId) continue;

      // 1 - update or create Season
      let season = await Season.findOne({
        where: { publishableId, operatingYear },
        transaction,
      });

      if (!season) {
        season = await Season.create(
          {
            publishableId,
            operatingYear,
            editable: !(operatingYear < currentYear),
            readyToPublish: true,
            seasonType: "regular",
            status: "published",
          },
          { transaction },
        );
      } else {
        season.editable = !(operatingYear < currentYear);
        season.readyToPublish = true;
        season.seasonType = "regular";
        season.status = "published";
        await season.save({ transaction });
      }

      // find DateType by name from park-feature-dates.dateType
      const dateTypeName = featureDate.dateType;
      const dateTypeObj = dateTypeByName[dateTypeName];

      if (!dateTypeObj) continue;

      // 2 - update or create DateRange
      if (featureDate.startDate && featureDate.endDate) {
        // check for duplicate DateRange
        const existingDateRange = await DateRange.findOne({
          where: {
            dateableId: feature.dateableId,
            seasonId: season.id,
            dateTypeId: dateTypeObj.id,
            startDate: new Date(featureDate.startDate),
            endDate: new Date(featureDate.endDate),
          },
          transaction,
        });

        // skip creation if duplicate found
        if (existingDateRange) continue;

        let dateRange = await DateRange.findOne({
          where: {
            dateableId: feature.dateableId,
            seasonId: season.id,
            dateTypeId: dateTypeObj.id,
          },
          transaction,
        });

        if (!dateRange) {
          dateRange = await DateRange.create(
            {
              dateableId: feature.dateableId,
              seasonId: season.id,
              dateTypeId: dateTypeObj.id,
              startDate: featureDate.startDate,
              endDate: featureDate.endDate,
            },
            { transaction },
          );
        } else {
          dateRange.dateableId = feature.dateableId;
          dateRange.startDate = new Date(featureDate.startDate);
          dateRange.endDate = new Date(featureDate.endDate);
          await dateRange.save({ transaction });
        }

        console.log(
          `Processed feature date range for feature ${feature.id}: ${dateRange.startDate} to ${dateRange.endDate} (${dateTypeName})`,
        );
      }
    }

    await transaction.commit();
    console.log("Park feature dates import complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error importing park feature dates:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  importParkFeatureDates().catch((err) => {
    console.error("Failed to import park feature dates:", err);
    throw err;
  });
}
