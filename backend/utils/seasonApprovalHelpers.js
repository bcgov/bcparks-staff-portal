import * as STATUS from "../constants/seasonStatus.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

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
      Boolean(season.parkArea.inReservationSystem) ||
      features.some((f) => f.inReservationSystem === true);

    const anyNotInReservationSystem =
      !anyInReservationSystem ||
      features.some((f) => f.inReservationSystem === false);

    return { anyInReservationSystem, anyNotInReservationSystem };
  }

  return { anyInReservationSystem: false, anyNotInReservationSystem: false };
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
 * @returns {{requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}} Required team approvals for this save
 */
export function getRequiredApprovalsForSeason({
  season,
  oldGateDetail,
  gateDetail,
}) {
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

  // Info Services team approval is required if hasGate is true,
  // or if hasGate was changed to false.
  const hasGateApprovalRequirement = requiresGateApproval(
    oldGateDetail,
    gateDetail,
  );

  if (hasGateApprovalRequirement) {
    requiresInformationSvcApproval = true;
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
 * @returns {{resolvedStatus: string, informationSvcApproved: boolean, reservationSvcApproved: boolean, requiresInformationSvcApproval: boolean, requiresReservationSvcApproval: boolean}} Resolved season status and approval state for the save
 */
export function resolveSeasonApprovalState({
  season,
  requestedNewStatus,
  oldGateDetail,
  gateDetail,
  isInformationSvcApprover,
  isReservationSvcApprover,
}) {
  const { requiresInformationSvcApproval, requiresReservationSvcApproval } =
    getRequiredApprovalsForSeason({
      season,
      oldGateDetail,
      gateDetail,
    });

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
