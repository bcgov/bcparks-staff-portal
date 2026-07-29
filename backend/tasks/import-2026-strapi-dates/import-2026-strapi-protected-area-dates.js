// This script is used to overwrite the existing DateRange and DateRangeAnnual data
// in the db with the data from Strapi for the operatingYears 2026 and onward. It is
// intended to be run as a one-time operation to update the database with records that
// were manually edited in Strapi after they were published to Strapi from DOOT.

import "../../env.js";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DateType,
  Park,
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

const protectedAreaDates = JSON.parse(
  fs.readFileSync(path.join(dirname, "protected-area-dates.json"), "utf8"),
);

// get a list of unique orcs, date_type_id and operating_year combos from the protectedArea data
const uniqueProtectedAreaDateKeys = [
  ...new Map(
    protectedAreaDates.map((item) => [
      `${item.orcs}-${item.date_type_id}-${item.operating_year}`,
      {
        orcs: String(item.orcs),
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
  // for each key in uniqueProtectedAreaDateKeys, find the list of corresponding DateRange records in the database and check if they match the JSON data.
  for (const key of uniqueProtectedAreaDateKeys) {
    const { orcs, dateTypeNumber, operatingYear } = key;

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

    // find the corresponding Park record in the database
    const park = await Park.findOne({
      where: { orcs },
      transaction,
    });

    if (!park) {
      console.error(`No Park found for orcs ${orcs}. Skipping...`);
      continue;
    }

    let dateableId = park.dateableId;

    // If dateableId is null, create one for the park
    if (!dateableId) {
      const dateable = await Dateable.create({}, { transaction });

      dateableId = dateable.id;
      park.dateableId = dateableId;
      await park.save({ transaction });

      console.log(
        `${dryRun ? "[DRY RUN] Would create" : "Created"} dateableId for park ${orcs}: ${dateableId}`,
      );
    }

    let publishableId = park.publishableId;

    // If publishableId is null, create one for the park
    if (!publishableId) {
      const publishable = await Publishable.create({}, { transaction });

      publishableId = publishable.id;
      park.publishableId = publishableId;
      await park.save({ transaction });

      console.log(
        `${dryRun ? "[DRY RUN] Would create" : "Created"} publishableId for park ${orcs}: ${publishableId}`,
      );
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

    // filter protectedAreaDates to find all records that match the current key
    const matchingProtectedAreaDates = protectedAreaDates.filter(
      (item) =>
        String(item.orcs) === orcs &&
        item.date_type_id === dateTypeNumber &&
        item.operating_year === operatingYear,
    );

    // for each matchingProtectedAreaDate, check if a DateRange record exists in the database
    for (const protectedAreaDate of matchingProtectedAreaDates) {
      const { start_date: startDate, end_date: endDate } = protectedAreaDate;

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
    // that are not in the matchingProtectedAreaDates
    const existingDateRanges = await DateRange.findAll({
      where: {
        dateableId,
        seasonId: season.id,
        dateTypeId: dateType.id,
      },
      transaction,
    });

    for (const existingDateRange of existingDateRanges) {
      const existsInProtectedAreaDates = matchingProtectedAreaDates.some(
        (item) =>
          item.start_date === existingDateRange.startDate &&
          item.end_date === existingDateRange.endDate,
      );

      if (!existsInProtectedAreaDates) {
        await existingDateRange.destroy({ transaction });

        dateRangesDeleted++;

        console.log(
          `${dryRun ? "[DRY RUN] Would delete" : "Deleted"} DateRange for dateableId ${dateableId}, dateTypeId ${dateType.id}, startDate ${existingDateRange.startDate}, endDate ${existingDateRange.endDate}`,
        );
      }
    }

    // Update DateRangeAnnual records based on the is_date_annual field in the matchingProtectedAreaDates
    const isDateAnnual = matchingProtectedAreaDates[0]?.is_date_annual ?? false;

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

  console.log(`\n${dryRun ? "[DRY RUN] " : ""}Strapi protected-area date import complete!

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
