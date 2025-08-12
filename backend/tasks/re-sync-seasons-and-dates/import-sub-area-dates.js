// This script imports park-operation-sub-area-dates from Strapi into Season and DateRange.

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

export async function importSubAreaDates() {
  const transaction = await Season.sequelize.transaction();

  try {
    // fetch all models from Strapi
    const strapiData = await fetchAllModels();
    // get park-operation-sub-area-dates data from Strapi
    const subAreaDatesData = getStrapiModelData(
      strapiData,
      "park-operation-sub-area-date",
    );

    // get all features and park areas for lookup
    const features = await Feature.findAll({ transaction });
    const featureByStrapiId = _.keyBy(features, "strapiId");
    const parkAreas = await ParkArea.findAll({ transaction });
    const parkAreaById = _.keyBy(parkAreas, "id");

    // get DateTypes for Operation, Reservation, and Backcountry
    const operationDateType = await DateType.findOne({
      where: { name: "Operation", featureLevel: true },
      transaction,
    });
    const reservationDateType = await DateType.findOne({
      where: { name: "Reservation", featureLevel: true },
      transaction,
    });
    const backcountryDateType = await DateType.findOne({
      where: { name: "Backcountry registration", featureLevel: true },
      transaction,
    });

    if (!operationDateType || !reservationDateType || !backcountryDateType) {
      throw new Error(
        'Required DateTypes "Operation", "Reservation", or "Backcountry registration" not found.',
      );
    }

    const currentYear = new Date().getFullYear();

    for (const subAreaDate of subAreaDatesData.items) {
      if (!subAreaDate.isActive) continue;

      const operatingYear = subAreaDate.operatingYear;
      const subArea = subAreaDate.parkOperationSubArea;

      if (!subArea) continue;

      // find Feature by Strapi ID
      const feature = featureByStrapiId[String(subArea.id)];
      let publishableId = null;

      // determine publishableId based on feature or park area
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

      // 2 - update or create DateRanges for service and reservation dates
      // service dates (Operation)
      if (subAreaDate.serviceStartDate && subAreaDate.serviceEndDate) {
        let dateRange = await DateRange.findOne({
          where: {
            dateableId: feature.dateableId,
            seasonId: season.id,
            dateTypeId: operationDateType.id,
          },
          transaction,
        });

        if (!dateRange) {
          dateRange = await DateRange.create(
            {
              dateableId: feature.dateableId,
              seasonId: season.id,
              dateTypeId: operationDateType.id,
              startDate: subAreaDate.serviceStartDate,
              endDate: subAreaDate.serviceEndDate,
            },
            { transaction },
          );
        } else {
          dateRange.dateableId = feature.dateableId;
          dateRange.startDate = new Date(subAreaDate.serviceStartDate);
          dateRange.endDate = new Date(subAreaDate.serviceEndDate);
          await dateRange.save({ transaction });
        }

        console.log(
          `Processed operation date range for feature ${feature.id}: ${dateRange.startDate} to ${dateRange.endDate}`,
        );
      }

      // reservation dates (Reservation)
      if (subAreaDate.reservationStartDate && subAreaDate.reservationEndDate) {
        // use backcountryDateType if subArea.hasBackcountryPermits is true
        const chosenDateType = subArea.hasBackcountryPermits
          ? backcountryDateType
          : reservationDateType;

        let dateRange = await DateRange.findOne({
          where: {
            dateableId: feature.dateableId,
            seasonId: season.id,
            dateTypeId: chosenDateType.id,
          },
          transaction,
        });

        if (!dateRange) {
          dateRange = await DateRange.create(
            {
              dateableId: feature.dateableId,
              seasonId: season.id,
              dateTypeId: chosenDateType.id,
              startDate: subAreaDate.reservationStartDate,
              endDate: subAreaDate.reservationEndDate,
            },
            { transaction },
          );
        } else {
          dateRange.dateableId = feature.dateableId;
          dateRange.startDate = new Date(subAreaDate.reservationStartDate);
          dateRange.endDate = new Date(subAreaDate.reservationEndDate);
          await dateRange.save({ transaction });
        }

        console.log(
          `Processed reservation date range for feature ${feature.id}: ${dateRange.startDate} to ${dateRange.endDate}`,
        );
      }
    }

    await transaction.commit();
    console.log("Sub-area dates import complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error importing sub-area dates:", err);
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  importSubAreaDates().catch((err) => {
    console.error("Failed to import sub-area dates:", err);
    throw err;
  });
}
