// This script creates winter seasons for parks that have hasWinterFeeDates = true.
// It will skip creating a season if one already exists for the given operating year and publishable.

import "../../env.js";

import {
  DateRange,
  DateRangeAnnual,
  DateType,
  Feature,
  Park,
  Season,
} from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import resolveNewSeasonStatus from "../../utils/resolveNewSeasonStatus.js";
import {
  createPublishableId,
  createDateableId,
} from "../../utils/seasonHelpers.js";

export default async function createWinterSeasons(
  operatingYear,
  transaction = null,
) {
  if (isNaN(operatingYear)) {
    console.info("Usage example: npm run create-winter-seasons 2027");
    throw new Error("Missing operating year");
  }

  console.log(
    `\nSTARTING CREATE-WINTER-SEASONS FOR OPERATING YEAR ${operatingYear}\n`,
  );

  // Track the number of rows inserted
  let publishablesAdded = 0;
  let dateablesAdded = 0;
  let winterSeasonsAdded = 0;
  let winterDateRangesAdded = 0;
  let winterDateRangeAnnualsAdded = 0;

  /**
   * Creates a new Publishable ID for a Park/Feature when missing.
   * @param {Park} record The record to check and update
   * @returns {Promise<number>} The record's Publishable ID
   */
  async function createPublishable(record) {
    const { key, added } = await createPublishableId(record, transaction);

    if (added) publishablesAdded++;

    return key;
  }

  /**
   * Creates a new Dateable ID a Park/Feature when missing.
   * @param {Park} record The record to check and update
   * @returns {Promise<number>} The record's Dateable ID
   */
  async function createDateable(record) {
    const { key, added } = await createDateableId(record, transaction);

    if (added) dateablesAdded++;

    return key;
  }

  /**
   * Creates a new Winter Season for a publishable/year pair if one does not exist.
   * @param {number} publishableId The Publishable ID to check
   * @param {number} year The operating year for the season
   * @param {string} itemName The park or feature name for logging
   * @returns {Promise<number|null>} The ID of the created Season, or existing season ID
   */
  async function createWinterSeason(publishableId, year, itemName) {
    // Check if a winter season already exists for this Publishable ID and Operating Year
    const existingSeason = await Season.findOne({
      where: {
        publishableId,
        operatingYear: year,
        seasonType: SEASON_TYPE.WINTER,
      },
      transaction,
    });

    if (existingSeason) {
      // Winter season already exists for this publishable and operating year
      return existingSeason.id;
    }

    // Determine the status of the new season based on annual dates
    const status = await resolveNewSeasonStatus(
      publishableId,
      SEASON_TYPE.WINTER,
      transaction,
    );

    const newSeason = await Season.create(
      {
        publishableId,
        operatingYear: year,
        seasonType: SEASON_TYPE.WINTER,
        status,
        readyToPublish: true,
      },
      { transaction },
    );

    winterSeasonsAdded++;
    console.log(
      `Created winter season for ${itemName} (Publishable ${publishableId}) - ${year}`,
    );

    return newSeason.id;
  }

  /**
   * Creates a placeholder Winter fee DateRange for the season/dateable when missing.
   * @param {number} seasonId The Season ID
   * @param {number} dateableId The Dateable ID
   * @param {number} winterFeeDateTypeId The Winter fee DateType ID
   * @param {string} itemName The park or feature name for logging
   * @returns {Promise<number|null>} The ID of the created DateRange, or existing DateRange ID
   */
  async function createWinterFeeDateRange(
    seasonId,
    dateableId,
    winterFeeDateTypeId,
    itemName,
  ) {
    // Check if a winter fee date range already exists for this season
    const existingDateRange = await DateRange.findOne({
      where: {
        seasonId,
        dateTypeId: winterFeeDateTypeId,
      },
      transaction,
    });

    if (existingDateRange) {
      // Winter fee date range already exists for this season
      return existingDateRange.id;
    }

    const newDateRange = await DateRange.create(
      {
        seasonId,
        dateableId,
        dateTypeId: winterFeeDateTypeId,
        startDate: null,
        endDate: null,
        adminNote: null,
      },
      { transaction },
    );

    winterDateRangesAdded++;
    console.log(
      `Created winter fee date range for ${itemName} (Season ${seasonId})`,
    );

    return newDateRange.id;
  }

  /**
   * Creates a DateRangeAnnual entry for a winter season Dateable, if missing.
   * @param {number} publishableId Publishable ID for the season
   * @param {number} dateableId Dateable ID for the winter date range
   * @param {number} winterFeeDateTypeId Winter fee DateType ID
   * @returns {Promise<void>}
   */
  async function ensureWinterDateRangeAnnual(
    publishableId,
    dateableId,
    winterFeeDateTypeId,
  ) {
    const [, created] = await DateRangeAnnual.findOrCreate({
      where: {
        publishableId,
        dateableId,
        dateTypeId: winterFeeDateTypeId,
      },
      defaults: {
        publishableId,
        dateableId,
        dateTypeId: winterFeeDateTypeId,
        isDateRangeAnnual: false,
      },
      transaction,
    });

    if (created) {
      winterDateRangeAnnualsAdded++;
    }
  }

  // Get the Winter fee DateType (used for both park and feature level dates)
  const winterFeeDateType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.WINTER_FEE,
    },
    transaction,
  });

  if (!winterFeeDateType) {
    console.error(`Winter fee DateType not found. Exiting.`);
    throw new Error("Winter fee DateType not found.");
  }

  // Get all Parks that have winter fee dates
  const parksWithWinterFees = await Park.findAll({
    attributes: [
      "id",
      "name",
      "publishableId",
      "dateableId",
      "hasWinterFeeDates",
    ],
    where: {
      hasWinterFeeDates: true,
    },
    transaction,
  });

  console.log(
    `Found ${parksWithWinterFees.length} Parks with Winter Fee Dates`,
  );

  if (parksWithWinterFees.length === 0) {
    console.log("No parks with winter fee dates found. Exiting.");
    return;
  }

  // Process each park
  const parkQueries = parksWithWinterFees.map(async (park) => {
    // Ensure the park has a publishableId
    const publishableId = await createPublishable(park);

    // Ensure the park has a dateableId
    const dateableId = await createDateable(park);

    // Create a winter season for this park
    const winterSeasonId = await createWinterSeason(
      publishableId,
      operatingYear,
      park.name,
    );

    // Create winter fee date range for the winter season
    if (winterSeasonId) {
      await createWinterFeeDateRange(
        winterSeasonId,
        dateableId,
        winterFeeDateType.id,
        park.name,
      );

      await ensureWinterDateRangeAnnual(
        publishableId,
        dateableId,
        winterFeeDateType.id,
      );
    }
  });

  await Promise.all(parkQueries);

  // Create winter seasons for Features flagged for winter fees
  const featuresWithWinterFees = await Feature.findAll({
    attributes: [
      "id",
      "name",
      "publishableId",
      "dateableId",
      "hasWinterFeeDates",
      "active",
    ],
    where: {
      hasWinterFeeDates: true,
      active: true,
    },
    transaction,
  });

  console.log(
    `Found ${featuresWithWinterFees.length} Features with Winter Fee Dates`,
  );

  const featureQueries = featuresWithWinterFees.map(async (feature) => {
    const publishableId = await createPublishable(feature);
    const dateableId = await createDateable(feature);

    const winterSeasonId = await createWinterSeason(
      publishableId,
      operatingYear,
      feature.name,
    );

    if (winterSeasonId) {
      await createWinterFeeDateRange(
        winterSeasonId,
        dateableId,
        winterFeeDateType.id,
        feature.name,
      );

      await ensureWinterDateRangeAnnual(
        publishableId,
        dateableId,
        winterFeeDateType.id,
      );
    }
  });

  await Promise.all(featureQueries);

  console.log(`\nSummary:`);
  console.log(`Added ${publishablesAdded} missing Park Publishables`);
  console.log(`Added ${dateablesAdded} missing Park Dateables`);
  console.log(`Added ${winterSeasonsAdded} new Winter Seasons`);
  console.log(`Added ${winterDateRangesAdded} new Winter Fee DateRanges`);
  console.log(
    `Added ${winterDateRangeAnnualsAdded} new Winter Fee DateRangeAnnuals`,
  );

  console.log(`Done creating winter seasons for ${operatingYear}\n`);
}

// Run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  // Get the operating year from command line arguments
  const operatingYear = Number(process.argv[2]);

  // Run all queries in a transaction
  const transaction = await Season.sequelize.transaction();

  try {
    await createWinterSeasons(operatingYear, transaction);
    await transaction.commit();
    console.log("\nTransaction committed successfully");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
