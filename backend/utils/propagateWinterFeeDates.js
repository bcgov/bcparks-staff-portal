// Recalculate Feature-level Winter fee dates from Park-level Winter fee dates.
// This runs on Winter fee date or Operation date saves so derived Winter ranges stay current.

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
import { APPROVED, PUBLISHED } from "../constants/seasonStatus.js";
import consolidateRanges from "./consolidateDateRanges.js";
import getOverlappingDateRanges from "./getOverlappingDateRanges.js";
import hasApprovedOperationSeasonForFeature from "./hasApprovedOperationSeasonForFeature.js";

const PROPAGATION_ALLOWED_STATUSES = [APPROVED, PUBLISHED];

async function getSeason(seasonId, transaction = null) {
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

  const operationType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.OPERATION,
    },
    transaction,
  });

  if (!operationType) {
    throw new Error("Operation DateType not found.");
  }

  return {
    winterTypeId: winterType.id,
    operationTypeId: operationType.id,
  };
}

/**
 * Gets the Park-level Winter fee season and its complete date ranges for an operating year.
 * @param {Park} park Park record that owns the winter season
 * @param {number} operatingYear Operating year to look up
 * @param {number} winterTypeId Winter fee DateType ID
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<{season: Season|null, ranges: Array}>} The Park winter season and its consolidated Winter fee ranges.
 */
async function getParkWinterDateRanges(
  park,
  operatingYear,
  winterTypeId,
  transaction = null,
) {
  const parkWinterSeason = await Season.findOne({
    attributes: ["id", "readyToPublish", "status"],
    where: {
      publishableId: park.publishableId,
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
      status: {
        [Op.in]: PROPAGATION_ALLOWED_STATUSES,
      },
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
      dateTypeId: winterTypeId,
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
 * @param {number} operationTypeId Operation DateType ID
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array>} Consolidated Operation date ranges for the Feature.
 */
async function getFeatureOperationRanges(
  feature,
  operatingYear,
  operationTypeId,
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
          status: {
            [Op.in]: PROPAGATION_ALLOWED_STATUSES,
          },
        },
      },
    ],
    where: {
      dateableId: feature.dateableId,
      dateTypeId: operationTypeId,
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
 * Returns the latest end date from a list of date ranges.
 * @param {Array<{endDate: Date}>} ranges Date ranges to inspect
 * @returns {Date|null} Latest end date, or null when no ranges exist
 */
function getLatestEndDate(ranges) {
  return ranges.reduce((latestEnd, range) => {
    if (!latestEnd || range.endDate > latestEnd) {
      return range.endDate;
    }

    return latestEnd;
  }, null);
}

/**
 * Returns the earliest start date from a list of date ranges.
 * @param {Array<{startDate: Date}>} ranges Date ranges to inspect
 * @returns {Date|null} Earliest start date, or null when no ranges exist
 */
function getEarliestStartDate(ranges) {
  return ranges.reduce((earliestStart, range) => {
    if (!earliestStart || range.startDate < earliestStart) {
      return range.startDate;
    }

    return earliestStart;
  }, null);
}

/**
 * Consolidates ranges and merges consecutive ranges where
 * current.startDate is on or before previous.endDate plus one day.
 * @param {Array<{startDate: Date, endDate: Date}>} ranges Date ranges to combine
 * @returns {Array<{startDate: Date, endDate: Date}>} Combined ranges
 */
function consolidateAndMergeConsecutiveRanges(ranges) {
  const consolidated = consolidateRanges(ranges);

  return consolidated.reduce((merged, currentRange) => {
    const lastRange = merged.at(-1);

    if (!lastRange) {
      merged.push(currentRange);
      return merged;
    }

    const nextDay = new Date(lastRange.endDate);

    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    if (currentRange.startDate <= nextDay) {
      if (currentRange.endDate > lastRange.endDate) {
        lastRange.endDate = currentRange.endDate;
      }

      return merged;
    }

    merged.push(currentRange);
    return merged;
  }, []);
}

/**
 * Calculates winter fee overlap ranges by combining park winter dates
 * with previous/current operation season dates while preserving gaps.
 * @param {Array} parkWinterRanges Park-level winter fee ranges for the requested winter season
 * @param {Array} previousOperationRanges Previous operating season ranges used only when they exist
 * @param {Array} currentOperationRanges Current operating season ranges
 * @returns {Array} Consolidated overlap ranges, or [] when none can be calculated
 */
export function getWinterFeeRangeWindow(
  parkWinterRanges,
  previousOperationRanges,
  currentOperationRanges,
) {
  const parkWinterStart = getEarliestStartDate(parkWinterRanges);
  const parkWinterEnd = getLatestEndDate(parkWinterRanges);

  if (!parkWinterStart || !parkWinterEnd) {
    return [];
  }

  const operationRanges = [
    ...previousOperationRanges,
    ...currentOperationRanges,
  ];

  const overlapRanges = getOverlappingDateRanges(
    parkWinterRanges,
    operationRanges,
  );

  return consolidateAndMergeConsecutiveRanges(overlapRanges);
}

/**
 * Replaces Winter fee DateRanges for a season/dateable pair.
 * @param {Object} params Replacement parameters
 * @param {number} params.seasonId Season ID to update
 * @param {number} params.dateableId Dateable ID to update
 * @param {number} params.dateTypeId Winter fee DateType ID
 * @param {Array} params.ranges New date ranges to insert
 * @param {boolean} [params.createPlaceholderWhenEmpty=false] Whether to insert a single empty placeholder when ranges is empty
 * @param {Transaction} [params.transaction] Optional Sequelize transaction
 * @returns {Promise<void>}
 */
async function rebuildWinterDateRanges({
  seasonId,
  dateableId,
  dateTypeId,
  ranges,
  createPlaceholderWhenEmpty = false,
  transaction = null,
}) {
  await DateRange.destroy({
    where: {
      seasonId,
      dateableId,
      dateTypeId,
    },
    transaction,
  });

  if (!ranges.length && !createPlaceholderWhenEmpty) {
    return;
  }

  await DateRange.bulkCreate(
    (ranges.length ? ranges : [{ startDate: null, endDate: null }]).map(
      (range) => ({
        seasonId,
        dateableId,
        dateTypeId,
        startDate: range.startDate,
        endDate: range.endDate,
      }),
    ),
    { transaction },
  );
}

/**
 * Synchronizes derived Winter season publishable state.
 * @param {Object} params State sync parameters
 * @param {Season} params.winterSeason Winter Season to update
 * @param {boolean|null|undefined} params.parkWinterReadyToPublish Ready-to-publish value to copy
 * @param {Transaction} [params.transaction] Optional Sequelize transaction
 * @returns {Promise<void>}
 */
async function syncWinterSeasonState({
  winterSeason,
  parkWinterReadyToPublish,
  transaction = null,
}) {
  if (
    parkWinterReadyToPublish !== null &&
    typeof parkWinterReadyToPublish !== "undefined"
  ) {
    winterSeason.readyToPublish = parkWinterReadyToPublish;
  }

  winterSeason.status = APPROVED;
  winterSeason.updatedAt = new Date();
  await winterSeason.save({ transaction });
}

/**
 * Rebuilds a Feature winter season's Winter fee DateRanges from the Park-level
 * Winter fee dates and the Feature's Operation date ranges.
 * @param {Feature} feature Feature record to recalculate
 * @param {number} operatingYear Operating year to process
 * @param {Array} overlaps Consolidated Winter fee overlap ranges for this Feature
 * @param {number} winterTypeId Winter fee DateType ID
 * @param {boolean|null} parkWinterReadyToPublish Ready-to-publish state to copy from the Park winter season
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the Feature winter season was updated, false when it did not exist
 */
async function syncFeatureWinterSeason(
  feature,
  operatingYear,
  overlaps,
  winterTypeId,
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

  await rebuildWinterDateRanges({
    seasonId: winterSeason.id,
    dateableId: feature.dateableId,
    dateTypeId: winterTypeId,
    ranges: overlaps,
    createPlaceholderWhenEmpty: true,
    transaction,
  });

  await syncWinterSeasonState({
    winterSeason,
    parkWinterReadyToPublish,
    transaction,
  });

  return true;
}

/**
 * Writes Feature winter fee DateRanges into the parent ParkArea winter season.
 * This is used for Features that belong to a ParkArea.
 * @param {Feature} feature Feature record to recalculate
 * @param {number} parkAreaPublishableId Parent ParkArea Publishable ID
 * @param {number} parkAreaDateableId Parent ParkArea Dateable ID
 * @param {number} operatingYear Operating year to process
 * @param {Array} overlaps Consolidated Winter fee overlap ranges for this Feature
 * @param {number} winterTypeId Winter fee DateType ID
 * @param {boolean|null} parkWinterReadyToPublish Ready-to-publish state to copy from the Park winter season
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the parent ParkArea winter season was updated, false when it did not exist
 */
async function syncFeatureWinterDatesOnParkAreaSeason(
  feature,
  parkAreaPublishableId,
  parkAreaDateableId,
  operatingYear,
  overlaps,
  winterTypeId,
  parkWinterReadyToPublish,
  transaction = null,
) {
  const winterSeason = await Season.findOne({
    where: {
      publishableId: parkAreaPublishableId,
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
    },
    transaction,
  });

  if (!winterSeason) {
    return false;
  }

  await rebuildWinterDateRanges({
    seasonId: winterSeason.id,
    dateableId: feature.dateableId,
    dateTypeId: winterTypeId,
    ranges: overlaps,
    createPlaceholderWhenEmpty: true,
    transaction,
  });

  if (parkAreaDateableId) {
    await DateRange.destroy({
      where: {
        seasonId: winterSeason.id,
        dateableId: parkAreaDateableId,
        dateTypeId: winterTypeId,
      },
      transaction,
    });
  }

  await syncWinterSeasonState({
    winterSeason,
    parkWinterReadyToPublish,
    transaction,
  });

  return true;
}

/**
 * Recalculates Feature-level Winter fee dates for a park + operating year.
 * Trigger this on Winter fee or Operation date saves.
 * @param {number} seasonId The season being approved/saved
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @param {Object} [options] Optional propagation controls
 * @param {boolean} [options.syncStateOnly=false] Sync only readyToPublish/status on derived winter seasons
 * @returns {Promise<{updatedFeatures:number, skippedFeatures:number, updatedParkAreas:number, skippedParkAreas:number, warnings:string[]}>}
 * Summary counts for propagated and skipped records, plus diagnostic warnings explaining why features were skipped.
 */
export default async function propagateWinterFeeDates(
  seasonId,
  transaction = null,
  options = {},
) {
  const warnings = [];
  const { syncStateOnly = false, targetWinterOperatingYear = null } = options;
  const sourceSeason = await getSeason(seasonId, transaction);

  if (!sourceSeason) {
    throw new Error(`Season ${seasonId} not found for Winter fee propagation.`);
  }

  const park = await getSeasonPark(sourceSeason, transaction);

  if (!park) {
    return {
      updatedFeatures: 0,
      skippedFeatures: 0,
      updatedParkAreas: 0,
      skippedParkAreas: 0,
    };
  }

  // Winter saves target their own operating year.
  // Regular operation saves target the prior winter operating year by default.
  const winterOperatingYear =
    targetWinterOperatingYear ??
    (sourceSeason.seasonType === SEASON_TYPE.REGULAR
      ? sourceSeason.operatingYear - 1
      : sourceSeason.operatingYear);

  const { winterTypeId, operationTypeId } = await getDateTypeIds(transaction);

  const parkWinter = await getParkWinterDateRanges(
    park,
    winterOperatingYear,
    winterTypeId,
    transaction,
  );

  // Do not recalculate derived Feature winter dates
  // until Park winter dates are in an approved/published season.
  if (!parkWinter.season) {
    // For regular-season edits, a missing prior winter season should not block
    // recalculation of the same-year winter season.
    if (
      sourceSeason.seasonType === SEASON_TYPE.REGULAR &&
      targetWinterOperatingYear === null
    ) {
      return propagateWinterFeeDates(seasonId, transaction, {
        ...options,
        targetWinterOperatingYear: sourceSeason.operatingYear,
      });
    }

    return {
      updatedFeatures: 0,
      skippedFeatures: 0,
      updatedParkAreas: 0,
      skippedParkAreas: 0,
      warnings,
    };
  }

  // If there is no Park-level Winter season, or it has no complete dates, clear derived Feature winter ranges.
  const winterDates = parkWinter.ranges || [];

  const features = await Feature.findAll({
    attributes: ["id", "name", "publishableId", "dateableId", "parkAreaId"],
    where: {
      parkId: park.id,
      hasWinterFeeDates: true,
      active: true,
    },
    include: [
      {
        model: ParkArea,
        as: "parkArea",
        attributes: ["id", "publishableId", "dateableId"],
        required: false,
      },
    ],
    transaction,
  });

  if (!features.length) {
    return {
      updatedFeatures: 0,
      skippedFeatures: 0,
      updatedParkAreas: 0,
      skippedParkAreas: 0,
      warnings,
    };
  }

  let updatedFeatures = 0;
  let skippedFeatures = 0;
  const updatedParkAreaIds = new Set();
  const skippedParkAreaIds = new Set();
  const syncedSeasonIds = new Set();

  for (const feature of features) {
    if (!feature.dateableId) {
      warnings.push(
        `Feature ${feature.id} (${feature.name}) has no dateableId. Skipping Winter fee propagation.`,
      );
      if (feature.parkAreaId) {
        skippedParkAreaIds.add(feature.parkAreaId);
      }
      skippedFeatures++;
      continue;
    }

    const featureHasParentParkArea = Boolean(feature.parkArea);

    if (!featureHasParentParkArea && !feature.publishableId) {
      warnings.push(
        `Feature ${feature.id} (${feature.name}) has no publishableId and is not in a parkArea. Skipping Winter fee propagation.`,
      );
      skippedFeatures++;
      continue;
    }

    if (featureHasParentParkArea && !feature.parkArea.publishableId) {
      warnings.push(
        `Feature ${feature.id} (${feature.name}) parkArea has no publishableId. Skipping Winter fee propagation.`,
      );
      skippedParkAreaIds.add(feature.parkArea.id);
      skippedFeatures++;
      continue;
    }

    if (syncStateOnly) {
      const winterSeason = await Season.findOne({
        where: {
          publishableId: featureHasParentParkArea
            ? feature.parkArea.publishableId
            : feature.publishableId,
          operatingYear: winterOperatingYear,
          seasonType: SEASON_TYPE.WINTER,
        },
        transaction,
      });

      if (!winterSeason) {
        warnings.push(
          `No winter season found for feature ${feature.id} (${feature.name}) in operating year ${winterOperatingYear}.`,
        );

        skippedFeatures++;

        if (featureHasParentParkArea) {
          skippedParkAreaIds.add(feature.parkArea.id);
        }

        continue;
      }

      if (!syncedSeasonIds.has(winterSeason.id)) {
        await syncWinterSeasonState({
          winterSeason,
          parkWinterReadyToPublish: parkWinter.season?.readyToPublish,
          transaction,
        });

        syncedSeasonIds.add(winterSeason.id);
      }

      updatedFeatures++;

      if (featureHasParentParkArea) {
        updatedParkAreaIds.add(feature.parkArea.id);
        skippedParkAreaIds.delete(feature.parkArea.id);
      }

      continue;
    }

    const hasApprovedOperationSeason =
      await hasApprovedOperationSeasonForFeature(
        feature,
        winterOperatingYear + 1,
        transaction,
      );

    // Skip until this Feature has an approved/published REGULAR season.
    // If the season exists but has no complete Operation dates, we still
    // proceed so overlaps=[] can clear derived Winter fee ranges.
    if (!hasApprovedOperationSeason) {
      warnings.push(
        `Feature ${feature.id} (${feature.name}) does not have an approved/published regular season for operating year ${
          winterOperatingYear + 1
        }. Skipping Winter fee propagation.`,
      );

      skippedFeatures++;

      if (featureHasParentParkArea) {
        skippedParkAreaIds.add(feature.parkArea.id);
      }

      continue;
    }

    const previousOperationRanges = await getFeatureOperationRanges(
      feature,
      winterOperatingYear,
      operationTypeId,
      transaction,
    );

    const currentOperationRanges = await getFeatureOperationRanges(
      feature,
      winterOperatingYear + 1,
      operationTypeId,
      transaction,
    );

    const winterFeeOverlapRanges = getWinterFeeRangeWindow(
      winterDates,
      previousOperationRanges,
      currentOperationRanges,
    );

    const overlaps = winterFeeOverlapRanges;

    const updated = featureHasParentParkArea
      ? await syncFeatureWinterDatesOnParkAreaSeason(
          feature,
          feature.parkArea.publishableId,
          feature.parkArea.dateableId,
          winterOperatingYear,
          overlaps,
          winterTypeId,
          parkWinter.season?.readyToPublish,
          transaction,
        )
      : await syncFeatureWinterSeason(
          feature,
          winterOperatingYear,
          overlaps,
          winterTypeId,
          parkWinter.season?.readyToPublish,
          transaction,
        );

    if (updated) {
      updatedFeatures++;

      if (featureHasParentParkArea) {
        updatedParkAreaIds.add(feature.parkArea.id);
        skippedParkAreaIds.delete(feature.parkArea.id);
      }
    } else {
      skippedFeatures++;

      warnings.push(
        `No winter season found for feature ${feature.id} (${feature.name}) in operating year ${winterOperatingYear}.`,
      );

      if (featureHasParentParkArea) {
        skippedParkAreaIds.add(feature.parkArea.id);
      }
    }
  }

  const output = {
    updatedFeatures,
    skippedFeatures,
    updatedParkAreas: updatedParkAreaIds.size,
    skippedParkAreas: skippedParkAreaIds.size,
    warnings,
  };

  // For regular-season operation edits, also recalculate the same-year winter
  // (where this regular year is the "previous" operation year).
  if (
    sourceSeason.seasonType === SEASON_TYPE.REGULAR &&
    targetWinterOperatingYear === null
  ) {
    const sameYearOutput = await propagateWinterFeeDates(
      seasonId,
      transaction,
      {
        ...options,
        targetWinterOperatingYear: sourceSeason.operatingYear,
      },
    );

    return {
      updatedFeatures: output.updatedFeatures + sameYearOutput.updatedFeatures,
      skippedFeatures: output.skippedFeatures + sameYearOutput.skippedFeatures,
      updatedParkAreas:
        output.updatedParkAreas + sameYearOutput.updatedParkAreas,
      skippedParkAreas:
        output.skippedParkAreas + sameYearOutput.skippedParkAreas,
      warnings: [...output.warnings, ...sameYearOutput.warnings],
    };
  }

  return output;
}
