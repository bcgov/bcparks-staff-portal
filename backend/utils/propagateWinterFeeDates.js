// Recalculate Feature-level Winter fee dates from Park-level Winter fee dates.
// This runs on Winter fee date or Operation date saves, status changes, and the
// cron task, so derived Winter ranges stay current and stale ones are cleared.

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
import toUtcDayTimestamp from "./toUtcDayTimestamp.js";

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
    if (
      !latestEnd ||
      toUtcDayTimestamp(range.endDate) > toUtcDayTimestamp(latestEnd)
    ) {
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
    if (
      !earliestStart ||
      toUtcDayTimestamp(range.startDate) < toUtcDayTimestamp(earliestStart)
    ) {
      return range.startDate;
    }

    return earliestStart;
  }, null);
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

    // Compare at UTC day precision so mixed Date/string inputs are handled consistently.
    const lastEndTs = toUtcDayTimestamp(lastRange.endDate);
    const currentStartTs = toUtcDayTimestamp(currentRange.startDate);
    const currentEndTs = toUtcDayTimestamp(currentRange.endDate);

    if (
      Number.isNaN(lastEndTs) ||
      Number.isNaN(currentStartTs) ||
      Number.isNaN(currentEndTs)
    ) {
      merged.push(currentRange);
      return merged;
    }

    const nextDayTs = lastEndTs + DAY_IN_MS;

    if (currentStartTs <= nextDayTs) {
      if (currentEndTs > lastEndTs) {
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
 * Builds an order-independent key for a list of date ranges, compared at UTC
 * day precision. Null dates (placeholders) are kept as "null".
 * @param {Array<{startDate: Date|string|null, endDate: Date|string|null}>} ranges Date ranges
 * @returns {string} Comparable key for the ranges
 */
export function getRangesSignature(ranges) {
  /**
   * Converts one date to its UTC day key, keeping nulls distinct.
   * @param {Date|string|null} date Date to convert
   * @returns {string} Day key
   */
  function toKey(date) {
    return date ? String(toUtcDayTimestamp(date)) : "null";
  }

  return ranges
    .map((range) => `${toKey(range.startDate)}-${toKey(range.endDate)}`)
    .sort()
    .join(",");
}

/**
 * Replaces Winter fee DateRanges for a season/dateable pair when they differ
 * from the desired ranges. Unchanged rows are left alone so their IDs (and any
 * cascading DateChangeLogs) survive repeated propagation runs.
 * @param {Object} params Replacement parameters
 * @param {number} params.seasonId Season ID to update
 * @param {number} params.dateableId Dateable ID to update
 * @param {number} params.dateTypeId Winter fee DateType ID
 * @param {Array} params.ranges New date ranges to insert
 * @param {boolean} [params.createPlaceholderWhenEmpty=false] Whether to insert a single empty placeholder when ranges is empty
 * @param {Transaction} [params.transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the stored ranges were changed
 */
async function rebuildWinterDateRanges({
  seasonId,
  dateableId,
  dateTypeId,
  ranges,
  createPlaceholderWhenEmpty = false,
  transaction = null,
}) {
  const where = {
    seasonId,
    dateableId,
    dateTypeId,
  };

  const desiredRanges =
    ranges.length || !createPlaceholderWhenEmpty
      ? ranges
      : [{ startDate: null, endDate: null }];

  // Skip the write when the stored ranges already match the desired ranges
  const existingRanges = await DateRange.findAll({
    attributes: ["startDate", "endDate"],
    where,
    transaction,
  });

  if (
    getRangesSignature(existingRanges.map((range) => range.toJSON())) ===
    getRangesSignature(desiredRanges)
  ) {
    return false;
  }

  await DateRange.destroy({ where, transaction });

  if (!desiredRanges.length) {
    return true;
  }

  await DateRange.bulkCreate(
    desiredRanges.map((range) => ({
      seasonId,
      dateableId,
      dateTypeId,
      startDate: range.startDate,
      endDate: range.endDate,
    })),
    { transaction },
  );

  return true;
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
 * Returns whether a derived Winter season's readyToPublish differs from the
 * Park winter season's value (ignoring a missing Park value).
 * @param {Season} winterSeason Derived Winter season
 * @param {boolean|null|undefined} parkWinterReadyToPublish Park winter readyToPublish
 * @returns {boolean} True when the derived season needs the Park value copied
 */
function hasReadinessMismatch(winterSeason, parkWinterReadyToPublish) {
  return (
    parkWinterReadyToPublish !== null &&
    typeof parkWinterReadyToPublish !== "undefined" &&
    winterSeason.readyToPublish !== parkWinterReadyToPublish
  );
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
 * @returns {Promise<boolean>} True when the Feature winter season exists (dates were reconciled), false when it did not exist
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

  const rangesChanged = await rebuildWinterDateRanges({
    seasonId: winterSeason.id,
    dateableId: feature.dateableId,
    dateTypeId: winterTypeId,
    ranges: overlaps,
    createPlaceholderWhenEmpty: true,
    transaction,
  });

  // Only touch status/readyToPublish when the dates or the Park's readiness
  // changed, so repeated runs (e.g. cron) don't move published seasons back to approved.
  if (
    rangesChanged ||
    hasReadinessMismatch(winterSeason, parkWinterReadyToPublish)
  ) {
    await syncWinterSeasonState({
      winterSeason,
      parkWinterReadyToPublish,
      transaction,
    });
  }

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
 * @returns {Promise<boolean>} True when the parent ParkArea winter season exists (dates were reconciled), false when it did not exist
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

  let rangesChanged = await rebuildWinterDateRanges({
    seasonId: winterSeason.id,
    dateableId: feature.dateableId,
    dateTypeId: winterTypeId,
    ranges: overlaps,
    createPlaceholderWhenEmpty: true,
    transaction,
  });

  if (parkAreaDateableId) {
    const deletedCount = await DateRange.destroy({
      where: {
        seasonId: winterSeason.id,
        dateableId: parkAreaDateableId,
        dateTypeId: winterTypeId,
      },
      transaction,
    });

    rangesChanged = rangesChanged || deletedCount > 0;
  }

  // Only touch status/readyToPublish when the dates or the Park's readiness
  // changed, so repeated runs (e.g. cron) don't move published seasons back to approved.
  if (
    rangesChanged ||
    hasReadinessMismatch(winterSeason, parkWinterReadyToPublish)
  ) {
    await syncWinterSeasonState({
      winterSeason,
      parkWinterReadyToPublish,
      transaction,
    });
  }

  return true;
}

/**
 * Returns the Winter season that owns a Feature's derived Winter fee dates:
 * the parent ParkArea's season, or the Feature's own season when it has no ParkArea.
 * @param {Feature} feature Feature record (with optional parkArea)
 * @param {Map<number, Season>} winterSeasonByPublishableId Winter seasons keyed by Publishable ID
 * @returns {Season|null} Owner Winter season, or null when none exists
 */
function getOwnerWinterSeason(feature, winterSeasonByPublishableId) {
  const ownerPublishableId = feature.parkArea
    ? feature.parkArea.publishableId
    : feature.publishableId;

  return winterSeasonByPublishableId.get(ownerPublishableId) ?? null;
}

/**
 * Loads the Winter seasons for an operating year that own the given Features'
 * derived Winter fee dates.
 * @param {Array<Feature>} features Features (with optional parkArea)
 * @param {number} operatingYear Winter operating year
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Map<number, Season>>} Winter seasons keyed by Publishable ID
 */
async function getOwnerWinterSeasons(features, operatingYear, transaction) {
  const publishableIds = [
    ...new Set(
      features
        .map((feature) =>
          feature.parkArea
            ? feature.parkArea.publishableId
            : feature.publishableId,
        )
        .filter(Boolean),
    ),
  ];

  if (!publishableIds.length) {
    return new Map();
  }

  const seasons = await Season.findAll({
    where: {
      publishableId: {
        [Op.in]: publishableIds,
      },
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
    },
    transaction,
  });

  return new Map(seasons.map((season) => [season.publishableId, season]));
}

/**
 * Deletes Winter fee DateRanges for the given Feature dateables in one Winter
 * operating year, except rows on the season listed for that dateable in
 * keepSeasonIdByDateableId, and empty placeholders for dateables in
 * keepPlaceholderDateableIds.
 * @param {Object} params Delete parameters
 * @param {Array<number>} params.dateableIds Feature Dateable IDs to check
 * @param {number} params.operatingYear Winter operating year
 * @param {number} params.winterTypeId Winter fee DateType ID
 * @param {Map<number, number>} [params.keepSeasonIdByDateableId] Dateable ID -> Winter season ID to keep
 * @param {Set<number>} [params.keepPlaceholderDateableIds] Dateable IDs whose empty placeholders are kept
 * @param {Transaction} [params.transaction] Optional Sequelize transaction
 * @returns {Promise<number>} Number of DateRanges deleted
 */
async function deleteStaleWinterFeeRanges({
  dateableIds,
  operatingYear,
  winterTypeId,
  keepSeasonIdByDateableId = new Map(),
  keepPlaceholderDateableIds = new Set(),
  transaction = null,
}) {
  if (!dateableIds.length) {
    return 0;
  }

  const derivedRanges = await DateRange.findAll({
    attributes: ["id", "seasonId", "dateableId", "startDate", "endDate"],
    include: [
      {
        model: Season,
        as: "season",
        attributes: ["id"],
        required: true,
        where: {
          operatingYear,
          seasonType: SEASON_TYPE.WINTER,
        },
      },
    ],
    where: {
      dateableId: {
        [Op.in]: dateableIds,
      },
      dateTypeId: winterTypeId,
    },
    transaction,
  });

  const staleRangeIds = derivedRanges
    .filter((range) => {
      if (keepSeasonIdByDateableId.get(range.dateableId) === range.seasonId) {
        return false;
      }

      // Keep placeholders that createWinterSeasons would just re-add,
      // so repeated cron runs don't create and delete the same row
      const isPlaceholder = !range.startDate && !range.endDate;

      return !(
        isPlaceholder && keepPlaceholderDateableIds.has(range.dateableId)
      );
    })
    .map((range) => range.id);

  if (!staleRangeIds.length) {
    return 0;
  }

  return await DateRange.destroy({
    where: {
      id: {
        [Op.in]: staleRangeIds,
      },
    },
    transaction,
  });
}

/**
 * Deletes stale derived Winter fee DateRanges for a Park's Features in one
 * Winter operating year. A Feature's rows are kept only on the season listed
 * for its dateable in keepSeasonIdByDateableId (its current owner season while
 * it still has winter fees). Everything else is stale: Features with the flag
 * turned off, inactive Features, and rows left on a former parent ParkArea.
 * Park-level (source) Winter fee rows are never deleted.
 * @param {Object} params Clear parameters
 * @param {Park} params.park Park record (needs id and dateableId)
 * @param {number} params.operatingYear Winter operating year to clear
 * @param {number} params.winterTypeId Winter fee DateType ID
 * @param {Map<number, number>} [params.keepSeasonIdByDateableId] Feature dateable ID -> Winter season ID to keep
 * @param {Transaction} [params.transaction] Optional Sequelize transaction
 * @returns {Promise<number>} Number of DateRanges deleted
 */
async function clearDerivedWinterFeeDates({
  park,
  operatingYear,
  winterTypeId,
  keepSeasonIdByDateableId = new Map(),
  transaction = null,
}) {
  // All of the Park's Features, regardless of winter flag or active status
  const parkFeatures = await Feature.findAll({
    attributes: ["id", "dateableId"],
    where: {
      parkId: park.id,
      dateableId: {
        [Op.ne]: null,
      },
    },
    transaction,
  });

  return await deleteStaleWinterFeeRanges({
    dateableIds: parkFeatures
      .map((feature) => feature.dateableId)
      .filter((dateableId) => dateableId !== park.dateableId),
    operatingYear,
    winterTypeId,
    keepSeasonIdByDateableId,
    transaction,
  });
}

/**
 * Replaces a Feature's derived Winter fee dates with a single empty placeholder
 * so the form stays usable while the dates can't be calculated.
 * Season status is left unchanged.
 * @param {Season|null} winterSeason Owner Winter season (no-op when null)
 * @param {number} dateableId Feature Dateable ID
 * @param {number} winterTypeId Winter fee DateType ID
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<void>}
 */
async function resetToPlaceholder(
  winterSeason,
  dateableId,
  winterTypeId,
  transaction = null,
) {
  if (!winterSeason) {
    return;
  }

  await rebuildWinterDateRanges({
    seasonId: winterSeason.id,
    dateableId,
    dateTypeId: winterTypeId,
    ranges: [],
    createPlaceholderWhenEmpty: true,
    transaction,
  });
}

/**
 * Recalculates Feature-level Winter fee dates for a park + operating year.
 * Trigger this on Winter fee or Operation date saves, when a source season
 * leaves approved/published, and from the scheduled cron task.
 * Derived dates that no longer apply (Feature flag off, inactive, Park dates
 * not approved, no approved Operation dates) are cleared or reset to placeholders.
 * @param {number} seasonId The season being approved/saved
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @param {Object} [options] Optional propagation controls
 * @param {boolean} [options.syncStateOnly=false] Sync only readyToPublish/status on derived winter seasons
 * @param {number|null} [options.targetWinterOperatingYear=null] Winter operating year to process (defaults from the source season)
 * @returns {Promise<{updatedFeatures:number, skippedFeatures:number, updatedParkAreas:number, skippedParkAreas:number, diagnostics:string[]}>}
 * Summary counts for propagated and skipped records, plus diagnostic information explaining why features were skipped.
 */
export default async function propagateWinterFeeDates(
  seasonId,
  transaction = null,
  options = {},
) {
  const diagnostics = [];
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

  // Features that should currently have derived Winter fee dates
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

  const winterSeasonByPublishableId = syncStateOnly
    ? new Map()
    : await getOwnerWinterSeasons(features, winterOperatingYear, transaction);

  if (!syncStateOnly) {
    // Clear derived dates that no longer apply (flag off, inactive, or left on
    // a former ParkArea) before recalculating. Only each flagged Feature's
    // current owner season is kept; it is reconciled below.
    const keepSeasonIdByDateableId = new Map();

    for (const feature of features) {
      const ownerSeason = getOwnerWinterSeason(
        feature,
        winterSeasonByPublishableId,
      );

      if (feature.dateableId && ownerSeason) {
        keepSeasonIdByDateableId.set(feature.dateableId, ownerSeason.id);
      }
    }

    await clearDerivedWinterFeeDates({
      park,
      operatingYear: winterOperatingYear,
      winterTypeId,
      keepSeasonIdByDateableId,
      transaction,
    });
  }

  // Do not recalculate derived Feature winter dates
  // until Park winter dates are in an approved/published season.
  if (!parkWinter.season) {
    // The Park dates are missing or being revised, so the derived dates are stale.
    // Reset them to placeholders without changing the derived season status.
    if (!syncStateOnly) {
      for (const feature of features) {
        if (feature.dateableId) {
          await resetToPlaceholder(
            getOwnerWinterSeason(feature, winterSeasonByPublishableId),
            feature.dateableId,
            winterTypeId,
            transaction,
          );
        }
      }
    }

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
      diagnostics,
    };
  }

  // If the Park-level Winter season has no complete dates, overlaps are empty
  // and derived Feature winter ranges are reset to placeholders.
  const winterDates = parkWinter.ranges || [];

  if (!features.length) {
    return {
      updatedFeatures: 0,
      skippedFeatures: 0,
      updatedParkAreas: 0,
      skippedParkAreas: 0,
      diagnostics,
    };
  }

  let updatedFeatures = 0;
  let skippedFeatures = 0;
  const updatedParkAreaIds = new Set();
  const skippedParkAreaIds = new Set();
  const syncedSeasonIds = new Set();

  for (const feature of features) {
    if (!feature.dateableId) {
      diagnostics.push(
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
      diagnostics.push(
        `Feature ${feature.id} (${feature.name}) has no publishableId and is not in a parkArea. Skipping Winter fee propagation.`,
      );
      skippedFeatures++;
      continue;
    }

    if (featureHasParentParkArea && !feature.parkArea.publishableId) {
      diagnostics.push(
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
        diagnostics.push(
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
    // proceed so overlaps=[] resets derived Winter fee ranges to a placeholder.
    if (!hasApprovedOperationSeason) {
      // Without approved Operation dates the derived dates can't be calculated,
      // so any previous dates are stale.
      await resetToPlaceholder(
        getOwnerWinterSeason(feature, winterSeasonByPublishableId),
        feature.dateableId,
        winterTypeId,
        transaction,
      );

      diagnostics.push(
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

      diagnostics.push(
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
    diagnostics,
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
      diagnostics: [...output.diagnostics, ...sameYearOutput.diagnostics],
    };
  }

  return output;
}

/**
 * Clears derived Feature Winter fee dates for Parks whose hasWinterFeeDates
 * flag is off. Normal propagation only runs for flagged Parks, so this catches
 * Features left behind when a Park's flag is turned off in Strapi.
 * Runs as a single batch across all unflagged Parks so it stays cheap on every
 * cron run. Empty placeholders for flagged, active Features are kept because
 * createWinterSeasons re-adds them on each run.
 * The Parks' own Winter fee dates and seasons are left untouched.
 * @param {number} operatingYear Winter operating year to clear
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<number>} Number of DateRanges deleted
 */
export async function clearWinterFeeDatesForUnflaggedParks(
  operatingYear,
  transaction = null,
) {
  const { winterTypeId } = await getDateTypeIds(transaction);

  // One query for every Feature in a Park with the flag off
  const features = await Feature.findAll({
    attributes: ["id", "dateableId", "hasWinterFeeDates", "active"],
    where: {
      dateableId: {
        [Op.ne]: null,
      },
    },
    include: [
      {
        model: Park,
        as: "park",
        attributes: ["id", "dateableId"],
        required: true,
        where: {
          hasWinterFeeDates: false,
        },
      },
    ],
    transaction,
  });

  // Never touch the Parks' own (source) Winter fee rows
  const featureDateables = features.filter(
    (feature) => feature.dateableId !== feature.park.dateableId,
  );

  return await deleteStaleWinterFeeRanges({
    dateableIds: featureDateables.map((feature) => feature.dateableId),
    operatingYear,
    winterTypeId,
    keepPlaceholderDateableIds: new Set(
      featureDateables
        .filter((feature) => feature.hasWinterFeeDates && feature.active)
        .map((feature) => feature.dateableId),
    ),
    transaction,
  });
}
