import { Op, Sequelize } from "sequelize";
import { SeasonChangeLog } from "../models/index.js";
import * as STATUS from "../constants/seasonStatus.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import getCurrentSeasonIds from "./getCurrentSeasonIds.js";
import { getCurrentDateCollectionYear } from "./operatingYearHelper.js";

/**
 * Returns which reservation-system coverage applies to this season.
 * For ParkArea seasons, coverage is checked at both the area and feature levels,
 * so both booleans can be true simultaneously when features have mixed values.
 * @param {Season} season Season object with park/parkArea/feature associations
 * @returns {{anyInReservationSystem: boolean, anyNotInReservationSystem: boolean}} Coverage flags for the season
 */
export function getSeasonReservationCoverage(season) {
  // Park regular seasons are applicable to Reservation Services when they have
  // Tier 1 or Tier 2 dates. Park inReservationSystem is not used for approvals.
  if (season.park) {
    const inRS =
      season.park.hasTier1Dates === true || season.park.hasTier2Dates === true;

    return { anyInReservationSystem: inRS, anyNotInReservationSystem: !inRS };
  }

  // Feature Season: check the Feature's inReservationSystem flag
  if (season.feature) {
    const inRS = Boolean(season.feature.inReservationSystem);

    return { anyInReservationSystem: inRS, anyNotInReservationSystem: !inRS };
  }

  // ParkArea Season: check the ParkArea's inReservationSystem flag,
  // and also check the inReservationSystem flags of all its Features.
  if (season.parkArea) {
    const features = season.parkArea.features || [];
    const anyInReservationSystem =
      season.parkArea.inReservationSystem === true ||
      features.some((f) => f.inReservationSystem === true);

    const anyNotInReservationSystem =
      season.parkArea.inReservationSystem !== true ||
      features.some((f) => f.inReservationSystem === false);

    return { anyInReservationSystem, anyNotInReservationSystem };
  }

  return { anyInReservationSystem: false, anyNotInReservationSystem: false };
}

/**
 * Returns whether a change log contains evidence that a gate existed.
 * Checking both snapshots also covers a gate whose first recorded change is its removal.
 * @param {Object} changeLog Season change log with old and new gate detail snapshots
 * @returns {boolean} True when either snapshot records hasGate as true
 */
export function changeLogHasGate(changeLog) {
  return (
    changeLog.gateDetailOldValue?.hasGate === true ||
    changeLog.gateDetailNewValue?.hasGate === true
  );
}

/**
 * Returns whether any loaded change log contains evidence that a gate existed.
 * @param {Array<Object>} [changeLogs=[]] Season change logs
 * @returns {boolean} True when at least one change log records hasGate as true
 */
export function hasGateHistory(changeLogs = []) {
  return changeLogs.some(changeLogHasGate);
}

/**
 * Fetches the IDs of seasons whose change logs show that a gate existed.
 * This bulk loader keeps database access separate from the pure approval rules.
 * @param {Array<number>|Set<number>} seasonIds Season IDs to check
 * @param {Object} [transaction] Optional Sequelize transaction
 * @returns {Promise<Set<number>>} Season IDs with gate history
 */
export async function fetchSeasonIdsWithGateHistory(seasonIds, transaction) {
  const ids = [...seasonIds];

  if (ids.length === 0) return new Set();

  const rows = await SeasonChangeLog.findAll({
    attributes: ["seasonId"],
    where: {
      seasonId: { [Op.in]: ids },
      [Op.or]: [
        Sequelize.literal(`("gateDetailOldValue"->>'hasGate')::boolean = true`),
        Sequelize.literal(`("gateDetailNewValue"->>'hasGate')::boolean = true`),
      ],
    },
    group: ["seasonId"],
    ...(transaction ? { transaction } : {}),
  });

  return new Set(rows.map((row) => row.seasonId));
}

/**
 * Returns whether one season's change logs show that a gate existed.
 * @param {number} seasonId Season ID to check
 * @param {Object} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the season has gate history
 */
export async function fetchHasGateHistory(seasonId, transaction) {
  const seasonIdsWithGateHistory = await fetchSeasonIdsWithGateHistory(
    [seasonId],
    transaction,
  );

  return seasonIdsWithGateHistory.has(seasonId);
}

/**
 * Returns whether a season is a Winter fee season at any level.
 * @param {Season} season Season object
 * @returns {boolean} True when the season type is Winter
 */
export function isWinterSeason(season) {
  return season?.seasonType === SEASON_TYPE.WINTER;
}

/**
 * Returns whether a season is a Winter fee season at Feature level.
 * @param {Season} season Season object with park/parkArea/feature associations
 * @returns {boolean} True when the season is Winter and not park-level
 */
export function isFeatureWinterSeason(season) {
  return (
    isWinterSeason(season) &&
    (Boolean(season?.parkArea) || Boolean(season?.feature))
  );
}

/**
 * Returns whether Information Services team approval is required for a season.
 * @param {Object} params Inputs used to determine the requirement
 * @param {Season} params.season Season with park/parkArea/feature associations
 * @param {Object|null} params.gateDetail Current gate detail
 * @param {boolean} params.hadGate Whether current or historical data shows that a gate existed
 * @returns {boolean} True when IS team approval is required
 */
export function seasonRequiresInformationSvcApproval({
  season,
  gateDetail,
  hadGate = false,
}) {
  // Winter fee seasons never require Information Services team approval.
  // Even if the park has a gate, the gate information is only checked on regular seasons.
  if (isWinterSeason(season)) {
    return false;
  }

  const { anyNotInReservationSystem } = getSeasonReservationCoverage(season);

  // IS team approval is required if inReservationSystem is false for any dates
  if (anyNotInReservationSystem) return true;

  // IS team approval is required when gate information currently exists,
  // or ever existed for this season form.
  if (gateDetail?.hasGate === true || hadGate) return true;

  return false;
}

/**
 * Returns whether Reservation Services team approval is required for a season.
 * @param {Object} params Inputs used to determine the requirement
 * @param {Season} params.season Season with park/parkArea/feature associations
 * @returns {boolean} True when RS team approval is required
 */
export function seasonRequiresReservationSvcApproval({ season }) {
  // Feature/Area Winter fee seasons are system-derived and do not require team-approval workflow.
  if (isFeatureWinterSeason(season)) {
    return false;
  }

  const { anyInReservationSystem } = getSeasonReservationCoverage(season);

  // RS team approval is required if inReservationSystem is true for any dates
  if (anyInReservationSystem) return true;

  // RS team approval is required for Park-level Winter fee seasons
  if (season.park && isWinterSeason(season)) {
    return true;
  }

  return false;
}

/**
 * Calculates all team approval requirements from data supplied by the caller.
 * @param {Object} params Inputs used to determine approval requirements
 * @param {Season} params.season Season with park/parkArea/feature associations
 * @param {Object|null} params.gateDetail Current gate detail
 * @param {boolean} params.hadGate Whether current or historical data shows that a gate existed
 * @returns {{requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}} Required team approvals
 */
export function getSeasonApprovalRequirements({
  season,
  gateDetail = null,
  hadGate = false,
}) {
  // Area and Feature Winter fee seasons are system-derived and do not require
  // either team's approval. Return early with both flags set to false.
  if (isFeatureWinterSeason(season)) {
    return {
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: false,
    };
  }

  const requiresReservationSvcApproval = seasonRequiresReservationSvcApproval({
    season,
  });
  const requiresInformationSvcApproval = seasonRequiresInformationSvcApproval({
    season,
    gateDetail,
    hadGate,
  });

  // After the Area/Feature Winter fee exemption, every form needs a reviewer.
  // This most often covers a gate-only form where hasGate has always been false
  // and there are no dates. Information Services is the default when no other
  // rule applies.
  if (!requiresInformationSvcApproval && !requiresReservationSvcApproval) {
    return {
      requiresInformationSvcApproval: true,
      requiresReservationSvcApproval: false,
    };
  }

  return {
    requiresInformationSvcApproval,
    requiresReservationSvcApproval,
  };
}

/**
 * Annotates a season with required team approval flags.
 * @param {Object} season Season object
 * @param {Object} context Context containing park/parkArea/feature and gate removal info
 * @returns {void} Modifies the season object in place
 */
function addTeamApprovalRequiredFlags(season, context) {
  if (!season) return;

  const seasonContext = {
    seasonType: season.seasonType,
    park: context.park,
    parkArea: context.parkArea,
    feature: context.feature,
  };
  const requirements = getSeasonApprovalRequirements({
    season: seasonContext,
    gateDetail: context.gateDetail,
    hadGate: context.seasonIdsWithGateHistory.has(season.id),
  });

  season.requiresInformationSvcApproval =
    requirements.requiresInformationSvcApproval;
  season.requiresReservationSvcApproval =
    requirements.requiresReservationSvcApproval;
}

/**
 * Adds required-approval flags to current seasons at park/area/feature levels.
 * @param {Array<Object>} parks Parks output array
 * @param {Set<number>} seasonIdsWithGateHistory Current season IDs whose change logs show that a gate existed
 * @returns {Array<Object>} Parks array with required-approval flags added
 */
export function addRequiredApprovalFlagsToCurrentSeasons(
  parks,
  seasonIdsWithGateHistory,
) {
  return parks.map((park) => {
    // Park object doesn't have currentSeason (winter or regular),
    // so we need to identify them in the seasons array.
    const currentParkSeasonIds = getCurrentSeasonIds(park.seasons);
    const currentParkSeasons = park.seasons.filter((season) =>
      currentParkSeasonIds.includes(season.id),
    );

    const parkContext = {
      park: {
        hasTier1Dates: park.hasTier1Dates,
        hasTier2Dates: park.hasTier2Dates,
      },
      gateDetail: { hasGate: park.hasGate },
      seasonIdsWithGateHistory,
    };

    currentParkSeasons.forEach((season) => {
      addTeamApprovalRequiredFlags(season, parkContext);
    });

    park.parkAreas.forEach((parkArea) => {
      const parkAreaContext = {
        parkArea: {
          inReservationSystem: parkArea.inReservationSystem,
          features: parkArea.features.map((feature) => ({
            inReservationSystem: feature.inReservationSystem,
          })),
        },
        gateDetail: { hasGate: parkArea.hasGate },
        seasonIdsWithGateHistory,
      };

      addTeamApprovalRequiredFlags(
        parkArea.currentSeason?.regular,
        parkAreaContext,
      );
    });

    park.features.forEach((feature) => {
      const featureContext = {
        feature: { inReservationSystem: feature.inReservationSystem },
        gateDetail: { hasGate: feature.hasGate },
        seasonIdsWithGateHistory,
      };

      addTeamApprovalRequiredFlags(
        feature.currentSeason?.regular,
        featureContext,
      );
    });

    return park;
  });
}

/**
 * Returns whether the Season's gate detail requires Information Services review.
 * Gate review is required when either the old or new gate detail shows that a gate ever existed.
 * @param {Object|null} oldGateDetail Existing gate detail before the save
 * @param {Object|null} newGateDetail Incoming gate detail from the request
 * @returns {boolean} True when the gate state requires Information Services review
 */
export function requiresGateApproval(oldGateDetail, newGateDetail) {
  const oldHasGate = oldGateDetail?.hasGate === true;
  const newHasGate = newGateDetail?.hasGate === true;

  // Information Services team must review seasons with current gate info,
  // or cases where gate information existed before this save.
  return oldHasGate || newHasGate;
}

/**
 * Calculates approval requirements for the season save workflow.
 * Uses the old and incoming gate details first, then fetches historical gate data only
 * when another rule has not already determined that Information Services review is required.
 * Delegates the final IS/RS decisions to getSeasonApprovalRequirements.
 * Logic is additive: a condition requiring an IS approval and
 * a different condition requiring RS approval would mean both IS and RS approval is required.
 * @param {Object} params Inputs used to determine approval requirements
 * @param {Season} params.season Season object with park/parkArea/feature association and reservation-system flags
 * @param {Object|null} params.oldGateDetail Existing gate detail before the save
 * @param {Object|null} params.gateDetail Incoming gate detail from the request
 * @returns {Promise<{requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}>} Required team approvals for this save
 */
async function calculateSaveApprovalRequirements({
  season,
  oldGateDetail,
  gateDetail,
}) {
  const hadGateInCurrentSave = requiresGateApproval(oldGateDetail, gateDetail);
  let { requiresInformationSvcApproval, requiresReservationSvcApproval } =
    getSeasonApprovalRequirements({
      season,
      gateDetail,
      hadGate: hadGateInCurrentSave,
    });

  // Skip the history query when another rule already requires IS approval.
  // Winter seasons never require IS approval, even if their publishable has gate history.
  if (!requiresInformationSvcApproval && !isWinterSeason(season) && season.id) {
    const hadGate = await fetchHasGateHistory(season.id);

    ({ requiresInformationSvcApproval, requiresReservationSvcApproval } =
      getSeasonApprovalRequirements({
        season,
        gateDetail,
        hadGate,
      }));
  }

  return {
    requiresInformationSvcApproval,
    requiresReservationSvcApproval,
  };
}

/**
 * Resolves team approval flags and the status that should be saved for this request.
 * Team-specific approvers can only satisfy their own side of the approval state.
 * Overall Season status can only be set to APPROVED with all required team approvals.
 * @param {Object} params Inputs used to resolve approval state
 * @param {Season} params.season Existing season from the DB
 * @param {string} params.requestedNewStatus Status requested by the user
 * @param {Object|null} params.oldGateDetail Existing gate detail from the DB
 * @param {Object|null} params.gateDetail Incoming gate detail from the user request
 * @param {boolean} params.isInformationSvcApprover Whether the current user can approve for Information Services
 * @param {boolean} params.isReservationSvcApprover Whether the current user can approve for Reservation Services
 * @returns {Promise<{resolvedStatus: string, informationSvcApproved: boolean, reservationSvcApproved: boolean, requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}>} Resolved season status and approval state for the save
 */
export async function resolveSeasonApprovalState({
  season,
  requestedNewStatus,
  oldGateDetail,
  gateDetail,
  isInformationSvcApprover,
  isReservationSvcApprover,
}) {
  const { requiresInformationSvcApproval, requiresReservationSvcApproval } =
    await calculateSaveApprovalRequirements({
      season,
      oldGateDetail,
      gateDetail,
    });

  // Check if the season is historical (past operating year) and if so, do not
  // require team-approval workflow.
  const currentDateCollectionYear = await getCurrentDateCollectionYear(
    season.seasonType,
  );

  if (season.operatingYear < currentDateCollectionYear) {
    const approvedStatuses = new Set([STATUS.APPROVED, STATUS.PUBLISHED]);

    return {
      resolvedStatus: requestedNewStatus,
      informationSvcApproved: approvedStatuses.has(requestedNewStatus),
      reservationSvcApproved: approvedStatuses.has(requestedNewStatus),
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: false,
    };
  }

  // Start with values from the DB (prior team approvals may already exist)
  let informationSvcApproved = season.informationSvcApproved;
  let reservationSvcApproved = season.reservationSvcApproved;
  let resolvedStatus = requestedNewStatus;

  // APPROVED status can only be set if all required team approvals are satisfied.
  // Any other status besides APPROVED or PUBLISHED resets both approval flags to false,
  // since the season is assumed to be reopened for edits rather than being approved.
  if (requestedNewStatus === STATUS.APPROVED) {
    // Record a team's approval whenever that team submits APPROVED.
    // This stores approver history even when that team's approval is not required for status promotion.
    // A team-specific approver can only satisfy their own side of the approval state.
    if (isInformationSvcApprover) {
      // Info Services team approver is approving
      informationSvcApproved = true;
    }

    if (isReservationSvcApprover) {
      // Reservation Services team approver is approving
      reservationSvcApproved = true;
    }

    const hasAllRequiredApprovals =
      (informationSvcApproved || !requiresInformationSvcApproval) &&
      (reservationSvcApproved || !requiresReservationSvcApproval);

    // Do not advance the workflow until every required team approval is satisfied.
    resolvedStatus = hasAllRequiredApprovals
      ? STATUS.APPROVED
      : STATUS.PENDING_REVIEW;
  } else if (requestedNewStatus !== STATUS.PUBLISHED) {
    // If the user is not approving or publishing the season,
    // reset the team approval flags to false, since the season is being modified.
    informationSvcApproved = false;
    reservationSvcApproved = false;
  }

  return {
    resolvedStatus,
    informationSvcApproved,
    reservationSvcApproved,
    requiresInformationSvcApproval,
    requiresReservationSvcApproval,
  };
}
