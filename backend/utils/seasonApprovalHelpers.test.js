import { describe, it, expect } from "vitest";
import {
  getSeasonReservationCoverage,
  changeLogHasGate,
  hasGateHistory,
  isWinterSeason,
  isFeatureWinterSeason,
  requiresGateApproval,
  getSeasonApprovalRequirements,
} from "./seasonApprovalHelpers.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

// NOTE: resolveSeasonApprovalState, fetchHasGateHistory, and
// fetchSeasonIdsWithGateHistory query Sequelize models and are intentionally
// untested here; add vi.mock("../models/index.js", ...) when covering them.

describe("getSeasonReservationCoverage", () => {
  it("uses tier flags for park seasons", () => {
    const season = { park: { hasTier1Dates: true, hasTier2Dates: false } };

    expect(getSeasonReservationCoverage(season)).toEqual({
      anyInReservationSystem: true,
      anyNotInReservationSystem: false,
    });
  });

  it("uses the feature's inReservationSystem flag for feature seasons", () => {
    const season = { feature: { inReservationSystem: false } };

    expect(getSeasonReservationCoverage(season)).toEqual({
      anyInReservationSystem: false,
      anyNotInReservationSystem: true,
    });
  });

  it("covers both flags for a parkArea with mixed feature values", () => {
    const season = {
      parkArea: {
        inReservationSystem: true,
        features: [{ inReservationSystem: false }],
      },
    };

    expect(getSeasonReservationCoverage(season)).toEqual({
      anyInReservationSystem: true,
      anyNotInReservationSystem: true,
    });
  });

  it("returns both flags false when the season has no known level", () => {
    expect(getSeasonReservationCoverage({})).toEqual({
      anyInReservationSystem: false,
      anyNotInReservationSystem: false,
    });
  });
});

describe("changeLogHasGate / hasGateHistory", () => {
  it("detects a gate from either the old or new snapshot", () => {
    expect(changeLogHasGate({ gateDetailOldValue: { hasGate: true } })).toBe(true);
    expect(changeLogHasGate({ gateDetailNewValue: { hasGate: true } })).toBe(true);
    expect(changeLogHasGate({})).toBe(false);
  });

  it("returns true when any change log in the list has gate history", () => {
    const changeLogs = [{}, { gateDetailNewValue: { hasGate: true } }];

    expect(hasGateHistory(changeLogs)).toBe(true);
  });

  it("returns false for an empty change log list", () => {
    expect(hasGateHistory([])).toBe(false);
  });
});

describe("isWinterSeason / isFeatureWinterSeason", () => {
  it("identifies winter seasons by seasonType", () => {
    expect(isWinterSeason({ seasonType: SEASON_TYPE.WINTER })).toBe(true);
    expect(isWinterSeason({ seasonType: SEASON_TYPE.REGULAR })).toBe(false);
  });

  it("only treats parkArea/feature winter seasons as feature-level", () => {
    const winterFeature = { seasonType: SEASON_TYPE.WINTER, feature: {} };
    const winterPark = { seasonType: SEASON_TYPE.WINTER, park: {} };

    expect(isFeatureWinterSeason(winterFeature)).toBe(true);
    expect(isFeatureWinterSeason(winterPark)).toBe(false);
  });
});

describe("requiresGateApproval", () => {
  it("requires approval if either the old or new gate detail has a gate", () => {
    expect(requiresGateApproval({ hasGate: true }, null)).toBe(true);
    expect(requiresGateApproval(null, { hasGate: true })).toBe(true);
    expect(requiresGateApproval({ hasGate: false }, { hasGate: false })).toBe(false);
  });
});

describe("getSeasonApprovalRequirements", () => {
  it("requires neither approval for Area/Feature winter seasons", () => {
    const season = { seasonType: SEASON_TYPE.WINTER, feature: {} };

    expect(getSeasonApprovalRequirements({ season })).toEqual({
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: false,
    });
  });

  it("requires Reservation Services approval for Park winter seasons", () => {
    const season = {
      seasonType: SEASON_TYPE.WINTER,
      park: { hasTier1Dates: false, hasTier2Dates: false },
    };

    expect(getSeasonApprovalRequirements({ season })).toEqual({
      requiresInformationSvcApproval: false,
      requiresReservationSvcApproval: true,
    });
  });

  it("requires Information Services approval when a gate exists on a regular season", () => {
    const season = { seasonType: SEASON_TYPE.REGULAR, feature: { inReservationSystem: true } };

    expect(
      getSeasonApprovalRequirements({ season, gateDetail: { hasGate: true } }),
    ).toEqual({
      requiresInformationSvcApproval: true,
      requiresReservationSvcApproval: true,
    });
  });

  it("defaults to Information Services approval when no other rule applies", () => {
    // No park/parkArea/feature association and no gate: gate-only form with no coverage
    const season = { seasonType: SEASON_TYPE.REGULAR };

    expect(getSeasonApprovalRequirements({ season })).toEqual({
      requiresInformationSvcApproval: true,
      requiresReservationSvcApproval: false,
    });
  });
});
