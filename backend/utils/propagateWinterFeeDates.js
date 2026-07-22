// Recalculate Feature-level Winter fee dates from Park-level Winter fee dates.
// This runs on approved saves so updates to Winter fee or Operation dates are reflected.

import { Op } from "sequelize";

import {
  DateRange,
  DateType,
  Feature,
  Park,
  ParkArea,
  Season,
} from "../models/index.js";
import * as DATE_TYPE from "../constants/dateType.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import { APPROVED } from "../constants/seasonStatus.js";
import consolidateRanges from "./consolidateDateRanges.js";
import getOverlappingDateRanges from "./getOverlappingDateRanges.js";

async function getSeasonWithOwner(seasonId, transaction = null) {
  return await Season.findByPk(seasonId, {
    include: [
      {
        model: Park,
        as: "park",
      },
      {
        model: ParkArea,
        as: "parkArea",
      },
      {
        model: Feature,
        as: "feature",
      },
    ],
    transaction,
  });
}

// Helper functions

/**
 * Returns the Park record associated with the given Season.
 * @param {Season} season Season record (could be Park, Area, or Feature Season)
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Park>} Park record for the Season
 */
async function getSeasonPark(season, transaction = null) {
  // If the season is a Park season, return the Park directly
  if (season.park) {
    return season.park;
  }

  // If the season is an Area season, get the Park details
  if (season.parkArea) {
    return await Park.findByPk(season.parkArea.parkId, { transaction });
  }

  // If the season is a Feature season, get the Park details from the Feature
  if (season.feature) {
    return await Park.findByPk(season.feature.parkId, { transaction });
  }

  throw new Error("Season does not have associated Park details.");
}

/**
 * Returns the DateType IDs needed for winter-fee propagation.
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Object>} DateType IDs used by the winter-fee propagation flow.
 */
async function getDateTypeIds(transaction = null) {
  const winterType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.WINTER_FEE,
    },
    transaction,
  });

  if (!winterType) {
    throw new Error("Winter fee DateType not found.");
  }

  const featureOperationType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.OPERATION,
      featureLevel: true,
    },
    transaction,
  });

  if (!featureOperationType) {
    throw new Error("Feature-level Operation DateType not found.");
  }

  return {
    parkWinterTypeId: winterType.id,
    featureWinterTypeId: winterType.id,
    featureOperationTypeId: featureOperationType.id,
  };
}

/**
 * Gets the Park-level Winter fee season and its complete date ranges for an operating year.
 * @param {Park} park Park record that owns the winter season
 * @param {number} operatingYear Operating year to look up
 * @param {number} parkWinterTypeId Winter fee DateType ID
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<{season: Season|null, ranges: Array}>} The Park winter season and its consolidated Winter fee ranges.
 */
async function getParkWinterDateRanges(
  park,
  operatingYear,
  parkWinterTypeId,
  transaction = null,
) {
  const parkWinterSeason = await Season.findOne({
    attributes: ["id", "readyToPublish"],
    where: {
      publishableId: park.publishableId,
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
    },
    transaction,
  });

  if (!parkWinterSeason) {
    return {
      season: null,
      ranges: [],
    };
  }

  const parkWinterRanges = await DateRange.findAll({
    where: {
      seasonId: parkWinterSeason.id,
      dateableId: park.dateableId,
      dateTypeId: parkWinterTypeId,
      startDate: {
        [Op.ne]: null,
      },
      endDate: {
        [Op.ne]: null,
      },
    },
    transaction,
  });

  return {
    season: parkWinterSeason,
    ranges: consolidateRanges(parkWinterRanges.map((range) => range.toJSON())),
  };
}

/**
 * Gets the consolidated Feature-level Operation date ranges for a given year.
 * @param {Feature} feature Feature record to inspect
 * @param {number} operatingYear Operating year to look up
 * @param {number} featureOperationTypeId Operation DateType ID
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Consolidated Operation date ranges for the Feature.
 */
async function getFeatureOperationRanges(
  feature,
  operatingYear,
  featureOperationTypeId,
  transaction = null,
) {
  const operationRanges = await DateRange.findAll({
    attributes: ["startDate", "endDate"],
    include: [
      {
        model: Season,
        as: "season",
        attributes: ["id"],
        required: true,
        where: {
          operatingYear,
          seasonType: SEASON_TYPE.REGULAR,
        },
      },
    ],
    where: {
      dateableId: feature.dateableId,
      dateTypeId: featureOperationTypeId,
      startDate: {
        [Op.ne]: null,
      },
      endDate: {
        [Op.ne]: null,
      },
    },
    transaction,
  });

  return consolidateRanges(operationRanges.map((range) => range.toJSON()));
}


/**
 * Rebuilds a Feature winter season's Winter fee DateRanges from the Park-level
 * Winter fee dates and the Feature's Operation date ranges.
 * @param {Feature} feature Feature record to recalculate
 * @param {number} operatingYear Operating year to process
 * @param {Array} parkWinterDates Consolidated Park-level Winter fee ranges
 * @param {number} featureWinterTypeId Winter fee DateType ID
 * @param {number} featureOperationTypeId Feature Operation DateType ID
 * @param {boolean|null} parkWinterReadyToPublish Ready-to-publish state to copy from the Park winter season
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the Feature winter season was updated, false when it did not exist
 */
async function syncFeatureWinterSeason(
  feature,
  operatingYear,
  parkWinterDates,
  featureWinterTypeId,
  featureOperationTypeId,
  parkWinterReadyToPublish,
  transaction = null,
) {
  const winterSeason = await Season.findOne({
    where: {
      publishableId: feature.publishableId,
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
    },
    transaction,
  });

  if (!winterSeason) {
    return false;
  }

  const operationRanges = await getFeatureOperationRanges(
    feature,
    operatingYear,
    featureOperationTypeId,
    transaction,
  );

  const overlaps = getOverlappingDateRanges(parkWinterDates, operationRanges);

  await DateRange.destroy({
    where: {
      seasonId: winterSeason.id,
      dateableId: feature.dateableId,
      dateTypeId: featureWinterTypeId,
    },
    transaction,
  });

  if (overlaps.length > 0) {
    await DateRange.bulkCreate(
      overlaps.map((range) => ({
        seasonId: winterSeason.id,
        dateableId: feature.dateableId,
        dateTypeId: featureWinterTypeId,
        startDate: range.startDate,
        endDate: range.endDate,
      })),
      { transaction },
    );
  }

  if (
    parkWinterReadyToPublish !== null &&
    typeof parkWinterReadyToPublish !== "undefined"
  ) {
    winterSeason.readyToPublish = parkWinterReadyToPublish;
  }

  // Feature-level Winter seasons are re-approval outputs and should remain publishable.
  winterSeason.status = APPROVED;
  winterSeason.updatedAt = new Date();
  await winterSeason.save({ transaction });

  return true;
}

/**
 * Recalculates Feature-level Winter fee dates for a park + operating year.
 * Trigger this on approved saves (including edit-published flows).
 * @param {number} seasonId The season being approved/saved
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean | Array>} Number of Feature winter seasons updated and skipped.
 */
export default async function propagateWinterFeeDates(
  seasonId,
  transaction = null,
) {
  const sourceSeason = await getSeasonWithOwner(seasonId, transaction);

  if (!sourceSeason) {
    throw new Error(`Season ${seasonId} not found for Winter fee propagation.`);
  }

  const park = await getSeasonPark(sourceSeason, transaction);

  if (
    !park ||
    !park.hasWinterFeeDates ||
    !park.publishableId ||
    !park.dateableId
  ) {
    return { updatedFeatures: 0, skippedFeatures: 0 };
  }

  const operatingYear = sourceSeason.operatingYear;

  const { parkWinterTypeId, featureWinterTypeId, featureOperationTypeId } =
    await getDateTypeIds(transaction);

  const parkWinter = await getParkWinterDateRanges(
    park,
    operatingYear,
    parkWinterTypeId,
    transaction,
  );

  // If there is no Park-level Winter season, or it has no complete dates, clear derived Feature winter ranges.
  const winterDates = parkWinter.ranges || [];

  const features = await Feature.findAll({
    attributes: ["id", "name", "publishableId", "dateableId"],
    where: {
      parkId: park.id,
      hasWinterFeeDates: true,
      active: true,
    },
    transaction,
  });

  if (!features.length) {
    return { updatedFeatures: 0, skippedFeatures: 0 };
  }

  let updatedFeatures = 0;
  let skippedFeatures = 0;

  for (const feature of features) {
    if (!feature.publishableId || !feature.dateableId) {
      skippedFeatures++;
      continue;
    }

    const updated = await syncFeatureWinterSeason(
      feature,
      operatingYear,
      winterDates,
      featureWinterTypeId,
      featureOperationTypeId,
      parkWinter.season?.readyToPublish,
      transaction,
    );

    if (updated) {
      updatedFeatures++;
    } else {
      skippedFeatures++;
    }
  }

  return {
    updatedFeatures,
    skippedFeatures,
  };
}
