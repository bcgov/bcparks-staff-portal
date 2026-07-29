import "../../env.js";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DateType,
  Feature,
  ParkArea,
  Season,
  DateRange,
  DateRangeAnnual,
  Publishable,
  Dateable,
} from "../../models/index.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_STATUS from "../../constants/seasonStatus.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Set to true to preview changes without writing to the database
const dryRun = false;

const featureDates = JSON.parse(
  fs.readFileSync(path.join(dirname, "feature-dates.json"), "utf8"),
);

// get a list of unique orcs_feature_number, date_type_id and operating_year combos from the featureDates data
const uniqueFeatureDateKeys = [
  ...new Map(
    featureDates.map((item) => [
      `${item.orcs_feature_number}-${item.date_type_id}-${item.operating_year}`,
      {
        orcsFeatureNumber: item.orcs_feature_number,
        dateTypeNumber: item.date_type_id,
        operatingYear: item.operating_year,
      },
    ]),
  ).values(),
];

let seasonsAdded = 0;
let dateRangesAdded = 0;
let dateRangesDeleted = 0;
let dateRangeAnnualsAdded = 0;
let dateRangeAnnualsUpdated = 0;

const transaction = await Season.sequelize.transaction();

try {
  // for each key in uniqueFeatureDateKeys, find the list of corresponding DateRange records in the database and check if they match the JSON data.
  for (const key of uniqueFeatureDateKeys) {
    const { orcsFeatureNumber, dateTypeNumber, operatingYear } = key;

    // find the corresponding DateType record in the database
    const dateType = await DateType.findOne({
      where: { dateTypeNumber },
      transaction,
    });

    if (!dateType) {
      console.error(
        `No DateType found for date_type_id ${dateTypeNumber}. Skipping...`,
      );
      continue;
    }

    // find the corresponding Feature record in the database
    const feature = await Feature.findOne({
      where: { orcsFeatureNumber },
      transaction,
    });

    if (!feature) {
      console.error(
        `No Feature found for orcs_feature_number ${orcsFeatureNumber}. Skipping...`,
      );
      continue;
    }

    // if the feature has a parkAreaId then get the parkArea
    let parkArea = null;

    if (feature.parkAreaId) {
      parkArea = await ParkArea.findOne({
        where: { id: feature.parkAreaId },
        transaction,
      });

      if (!parkArea) {
        console.error(
          `No Park Area found for parkAreaId ${feature.parkAreaId}. Skipping...`,
        );
        continue;
      }
    }

    let dateableId = feature.dateableId;

    // If dateableId is null, create one for the feature
    if (!dateableId) {
      const dateable = await Dateable.create({}, { transaction });

      dateableId = dateable.id;
      feature.dateableId = dateableId;
      await feature.save({ transaction });

      console.log(
        `${dryRun ? "[DRY RUN] Would create" : "Created"} dateableId for feature ${orcsFeatureNumber}: ${dateableId}`,
      );
    }

    let publishableId = parkArea
      ? parkArea.publishableId
      : feature.publishableId;

    // If publishableId is still null, create one for the parkArea or feature
    if (!publishableId) {
      const publishable = await Publishable.create({}, { transaction });

      publishableId = publishable.id;
      if (parkArea) {
        parkArea.publishableId = publishableId;
        await parkArea.save({ transaction });
        console.log(
          `${dryRun ? "[DRY RUN] Would create" : "Created"} publishableId for park area ${parkArea.id}: ${publishableId}`,
        );
      } else {
        feature.publishableId = publishableId;
        await feature.save({ transaction });
        console.log(
          `${dryRun ? "[DRY RUN] Would create" : "Created"} publishableId for feature ${orcsFeatureNumber}: ${publishableId}`,
        );
      }
    }

    const seasonType =
      dateTypeNumber === DATE_TYPE.WINTER_FEE
        ? SEASON_TYPE.WINTER
        : SEASON_TYPE.REGULAR;

    // get the season for the publishableId, operatingYear and seasonType
    let season = await Season.findOne({
      where: {
        publishableId,
        operatingYear,
        seasonType,
      },
      transaction,
    });

    if (!season) {
      // create the Season record if it doesn't exist
      season = await Season.create(
        {
          publishableId,
          operatingYear,
          seasonType,
          status: SEASON_STATUS.PUBLISHED,
          readyToPublish: true,
        },
        { transaction },
      );

      seasonsAdded++;

      console.log(
        `${dryRun ? "[DRY RUN] Would create" : "Created"} new Season for publishableId ${publishableId}, operatingYear ${operatingYear}, seasonType ${seasonType}`,
      );
    }

    // filter featureDates to find all records that match the current key
    const matchingFeatureDates = featureDates.filter(
      (item) =>
        item.orcs_feature_number === orcsFeatureNumber &&
        item.date_type_id === dateTypeNumber &&
        item.operating_year === operatingYear,
    );

    // for each matchingFeatureDate, check if a DateRange record exists in the database
    for (const featureDate of matchingFeatureDates) {
      const { start_date: startDate, end_date: endDate } = featureDate;

      // find the corresponding DateRange record in the database
      const dateRange = await DateRange.findOne({
        where: {
          dateableId,
          dateTypeId: dateType.id,
          seasonId: season.id,
          startDate,
          endDate,
        },
        transaction,
      });

      if (!dateRange) {
        // create the DateRange record if it doesn't exist
        await DateRange.create(
          {
            dateableId,
            dateTypeId: dateType.id,
            seasonId: season.id,
            startDate,
            endDate,
          },
          { transaction },
        );

        dateRangesAdded++;

        console.log(
          `${dryRun ? "[DRY RUN] Would create" : "Created"} new DateRange for dateableId ${dateableId}, dateTypeId ${dateType.id}, startDate ${startDate}, endDate ${endDate}`,
        );
      }
    }

    // delete any DateRange records that exist in the database for this dateableId, seasonId and dateTypeId
    // that are not in the matchingFeatureDates
    const existingDateRanges = await DateRange.findAll({
      where: {
        dateableId,
        seasonId: season.id,
        dateTypeId: dateType.id,
      },
      transaction,
    });

    for (const existingDateRange of existingDateRanges) {
      const existsInFeatureDates = matchingFeatureDates.some(
        (item) =>
          item.start_date === existingDateRange.startDate &&
          item.end_date === existingDateRange.endDate,
      );

      if (!existsInFeatureDates) {
        await existingDateRange.destroy({ transaction });

        dateRangesDeleted++;

        console.log(
          `${dryRun ? "[DRY RUN] Would delete" : "Deleted"} DateRange for dateableId ${dateableId}, dateTypeId ${dateType.id}, startDate ${existingDateRange.startDate}, endDate ${existingDateRange.endDate}`,
        );
      }
    }

    // Update DateRangeAnnual records based on the is_date_annual field in the matchingFeatureDates
    const isDateAnnual = matchingFeatureDates[0]?.is_date_annual ?? false;

    const dateRangeAnnual = await DateRangeAnnual.findOne({
      where: {
        publishableId,
        dateableId,
        dateTypeId: dateType.id,
      },
      transaction,
    });

    if (isDateAnnual !== dateRangeAnnual?.isDateRangeAnnual) {
      if (!dateRangeAnnual) {
        // create the DateRangeAnnual record if it doesn't exist
        await DateRangeAnnual.create(
          {
            publishableId,
            dateableId,
            dateTypeId: dateType.id,
            isDateRangeAnnual: isDateAnnual,
          },
          { transaction },
        );

        dateRangeAnnualsAdded++;

        console.log(
          `${dryRun ? "[DRY RUN] Would create" : "Created"} new DateRangeAnnual for publishableId ${publishableId}, dateableId ${dateableId}, dateTypeId ${dateType.id}, isDateRangeAnnual ${isDateAnnual}`,
        );
      } else {
        // update the DateRangeAnnual record if it exists
        dateRangeAnnual.isDateRangeAnnual = isDateAnnual;
        await dateRangeAnnual.save({ transaction });

        dateRangeAnnualsUpdated++;

        console.log(
          `${dryRun ? "[DRY RUN] Would update" : "Updated"} DateRangeAnnual for publishableId ${publishableId}, dateableId ${dateableId}, dateTypeId ${dateType.id}, isDateRangeAnnual ${isDateAnnual}`,
        );
      }
    }
  }

  if (dryRun) {
    await transaction.rollback();
    console.log("\n[DRY RUN] Changes rolled back.");
  } else {
    await transaction.commit();
  }

  console.log(`\n${dryRun ? "[DRY RUN] " : ""}Strapi feature date import complete!

Seasons added:            ${seasonsAdded}
DateRanges added:         ${dateRangesAdded}
DateRanges deleted:       ${dateRangesDeleted}
DateRangeAnnuals added:   ${dateRangeAnnualsAdded}
DateRangeAnnuals updated: ${dateRangeAnnualsUpdated}`);
} catch (error) {
  await transaction.rollback();
  console.error("Import failed:", error);
  throw error;
}
