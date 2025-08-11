// This script imports park-feature-dates from Strapi into Season and DateRange.

import "../../env.js";
import _ from "lodash";

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
    const featureByStrapiId = _.keyBy(features, (feature) =>
      String(feature.strapiId),
    );
    const parkAreas = await ParkArea.findAll({ transaction });
    const parkAreaById = _.keyBy(parkAreas, (parkArea) => String(parkArea.id));

    // get all DateTypes for lookup by name
    const dateTypes = await DateType.findAll({ transaction });
    const dateTypeByName = _.keyBy(dateTypes, (dateType) => dateType.name);

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
            editable: operatingYear >= currentYear,
            readyToPublish: true,
            seasonType: "regular",
            status: "published",
          },
          { transaction },
        );
      } else {
        season.editable = operatingYear >= currentYear;
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
        // fetch all DateRanges for this season and feature only once per loop iteration
        if (!feature.dateRangesCache) {
          const allRanges = await DateRange.findAll({
            where: {
              seasonId: season.id,
              dateableId: feature.dateableId,
            },
            transaction,
          });

          feature.dateRangesCache = allRanges;
        }

        // check for duplicate DateRange
        const exists = feature.dateRangesCache.some(
          (dateRange) =>
            dateRange.dateTypeId === dateTypeObj.id &&
            new Date(dateRange.startDate).toISOString() ===
              new Date(featureDate.startDate).toISOString() &&
            new Date(dateRange.endDate).toISOString() ===
              new Date(featureDate.endDate).toISOString(),
        );

        if (exists) continue;

        // otherwise, create the DateRange and add to cache
        const newRange = await DateRange.create(
          {
            dateableId: feature.dateableId,
            seasonId: season.id,
            dateTypeId: dateTypeObj.id,
            startDate: featureDate.startDate,
            endDate: featureDate.endDate,
          },
          { transaction },
        );

        feature.dateRangesCache.push(newRange);

        console.log(
          `Processed feature date range for feature ${feature.id}: ${featureDate.startDate} to ${featureDate.endDate} (${dateTypeName})`,
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
