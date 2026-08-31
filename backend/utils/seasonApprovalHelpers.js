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
  // Park Season: check the Park's inReservationSystem flag
  if (season.park) {
    const inRS = Boolean(season.park.inReservationSystem);

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
 * Returns whether hasGate was ever changed from true to false for a season.
 * Any gate removal at any point in the season's history is treated as requiring IS review.
 * @param {number} seasonId The ID of the season to check
 * @returns {Promise<boolean>} True if a gate removal is recorded in the changelogs
 */
export async function hasGateRemoved(seasonId) {
  const log = await SeasonChangeLog.findOne({
    attributes: ["id"],
    where: {
      seasonId,
      [Op.and]: [
        Sequelize.literal(`("gateDetailOldValue"->>'hasGate')::boolean = true`),
        Sequelize.literal(
          `("gateDetailNewValue"->>'hasGate')::boolean = false`,
        ),
      ],
    },
  });

  return log !== null;
}

/**
 * Returns whether a season is a Winter fee season at Feature level.
 * @param {Season} season Season object with park/parkArea/feature associations
 * @returns {boolean} True when the season is Winter and not park-level
 */
export function isFeatureWinterSeason(season) {
  return (
    season?.seasonType === SEASON_TYPE.WINTER &&
    (Boolean(season?.parkArea) || Boolean(season?.feature))
  );
}

/**
 * Returns whether Information Services team approval is required for a season.
 * @param {Season} season Season with park/parkArea/feature and optional gateDetail/changeLogs data
 * @returns {boolean} True when IS team approval is required
 */
export function seasonRequiresInformationSvcApproval(season) {
  // Feature/Area Winter fee seasons are system-derived and do not require team-approval workflow.
  if (isFeatureWinterSeason(season)) {
    return false;
  }

  const { anyNotInReservationSystem } = getSeasonReservationCoverage(season);

  // IS team approval is required if inReservationSystem is false for any dates
  if (anyNotInReservationSystem) return true;

  // IS team approval is required if hasGate is true
  if (season.gateDetail?.hasGate === true) return true;

  // IS team approval is required if hasGate was changed to false
  const gateRemoved = (season.changeLogs || []).some((changeLog) => {
    const oldHasGate = changeLog.gateDetailOldValue?.hasGate === true;
    const newHasGate = changeLog.gateDetailNewValue?.hasGate === true;

    return oldHasGate && !newHasGate;
  });

  if (gateRemoved) return true;

  return false;
}

/**
 * Returns whether Reservation Services team approval is required for a season.
 * @param {Season} season Season with park/parkArea/feature associations
 * @returns {boolean} True when RS team approval is required
 */
export function seasonRequiresReservationSvcApproval(season) {
  // Feature/Area Winter fee seasons are system-derived and do not require team-approval workflow.
  if (isFeatureWinterSeason(season)) {
    return false;
  }

  const { anyInReservationSystem } = getSeasonReservationCoverage(season);

  // RS team approval is required if inReservationSystem is true for any dates
  if (anyInReservationSystem) return true;

  // RS team approval is required for Park-level Winter fee seasons
  if (season.park && season.seasonType === SEASON_TYPE.WINTER) {
    return true;
  }

  return false;
}

/**
 * Annotates a season with required team approval flags.
 * @param {Object} season Season object
 * @param {Object} context Context containing park/parkArea/feature and gate removal info
 * @returns {void} Modifies the season object in place
 */
function addTeamApprovalRequiredFlags(season, context) {
  if (!season) return;

  const gateRemovedSeasonIds = context.gateRemovedSeasonIds || new Set();

  const gateRemoved = gateRemovedSeasonIds.has(season.id);
  const seasonContext = {
    seasonType: season.seasonType,
    park: context.park,
    parkArea: context.parkArea,
    feature: context.feature,
    gateDetail: context.gateDetail,
    changeLogs: gateRemoved
      ? [
          {
            gateDetailOldValue: { hasGate: true },
            gateDetailNewValue: { hasGate: false },
          },
        ]
      : [],
  };

  season.requiresInformationSvcApproval =
    seasonRequiresInformationSvcApproval(seasonContext);
  season.requiresReservationSvcApproval =
    seasonRequiresReservationSvcApproval(seasonContext);
}

/**
 * Adds required-approval flags to current seasons at park/area/feature levels.
 * @param {Array<Object>} parks Parks output array
 * @param {Set<number>} gateRemovedSeasonIds Current season IDs where gate was changed from true to false
 * @returns {Array<Object>} Parks array with required-approval flags added
 */
export function addRequiredApprovalFlagsToCurrentSeasons(
  parks,
  gateRemovedSeasonIds,
) {
  return parks.map((park) => {
    // Park object doesn't have currentSeason (winter or regular),
    // so we need to identify them in the seasons array.
    const currentParkSeasonIds = getCurrentSeasonIds(park.seasons);
    const currentParkSeasons = park.seasons.filter((season) =>
      currentParkSeasonIds.includes(season.id),
    );

    const parkContext = {
      park: { inReservationSystem: park.inReservationSystem },
      gateDetail: { hasGate: park.hasGate },
      gateRemovedSeasonIds,
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
        gateRemovedSeasonIds,
      };

      addTeamApprovalRequiredFlags(
        parkArea.currentSeason?.regular,
        parkAreaContext,
      );
    });

    park.features.forEach((feature) => {
      const featureContext = {
        feature: { inReservationSystem: feature.inReservationSystem },
        gateRemovedSeasonIds,
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
 * Gate review is required when the gate detail hasGate value is true,
 * or when hasGate is changed from true to false.
 * @param {Object|null} oldGateDetail Existing gate detail before the save
 * @param {Object|null} newGateDetail Incoming gate detail from the request
 * @returns {boolean} True when the gate state requires Information Services review
 */
export function requiresGateApproval(oldGateDetail, newGateDetail) {
  const oldHasGate = oldGateDetail?.hasGate === true;
  const newHasGate = newGateDetail?.hasGate === true;
  const removedGate = oldHasGate && !newHasGate;

  // Information Services team must review seasons with gate info,
  // or cases where a gate was removed.
  return newHasGate || removedGate;
}

/**
 * Determines which team approvals are required to change the season status to APPROVED so it can be published.
 * The decision is based on reservation-system coverage and gate data.
 * Logic is additive: a condition requiring an IS approval and
 * a different condition requiring RS approval would mean both IS and RS approval is required.
 * @param {Object} params Inputs used to determine approval requirements
 * @param {Season} params.season Season object with park/parkArea/feature association and reservation-system flags
 * @param {Object|null} params.oldGateDetail Existing gate detail before the save
 * @param {Object|null} params.gateDetail Incoming gate detail from the request
 * @returns {Promise<{requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}>} Required team approvals for this save
 */
export async function getRequiredApprovalsForSeason({
  season,
  oldGateDetail,
  gateDetail,
}) {
  // Feature/Area Winter fee seasons are system-derived and bypass team approvals.
  // Park-level Winter fee seasons still follow approval workflow.
  if (isFeatureWinterSeason(season)) {
    return {
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: false,
    };
  }

  let requiresInformationSvcApproval = false;
  let requiresReservationSvcApproval = false;

  const { anyInReservationSystem, anyNotInReservationSystem } =
    getSeasonReservationCoverage(season);

  if (anyInReservationSystem) requiresReservationSvcApproval = true;
  if (anyNotInReservationSystem) requiresInformationSvcApproval = true;

  // Park-level Winter fee seasons require RS approval.
  if (season.park && season.seasonType === SEASON_TYPE.WINTER) {
    requiresReservationSvcApproval = true;
  }

  // IS approval required if hasGate is currently true, or is being removed in this save.
  if (requiresGateApproval(oldGateDetail, gateDetail)) {
    requiresInformationSvcApproval = true;
  }

  // IS approval required if hasGate was ever removed in a previous save.
  // Skip the query if IS approval is already determined.
  if (!requiresInformationSvcApproval && season.id) {
    if (await hasGateRemoved(season.id)) {
      requiresInformationSvcApproval = true;
    }
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
    await getRequiredApprovalsForSeason({
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
  // Any other status can be set without team approvals, and will not change the approval flags.
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
    resolvedStatus = hasAllRequiredApprovals ? STATUS.APPROVED : season.status;
  }

  return {
    resolvedStatus,
    informationSvcApproved,
    reservationSvcApproved,
    requiresInformationSvcApproval,
    requiresReservationSvcApproval,
  };
}
