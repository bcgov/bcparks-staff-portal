import { describe, it, expect } from "vitest";
import getCurrentSeasonIds from "./getCurrentSeasonIds.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

describe("getCurrentSeasonIds", () => {
  it("returns the highest operatingYear season id per seasonType", () => {
    const seasons = [
      { id: 1, seasonType: SEASON_TYPE.REGULAR, operatingYear: 2024 },
      { id: 2, seasonType: SEASON_TYPE.REGULAR, operatingYear: 2025 },
      { id: 3, seasonType: SEASON_TYPE.WINTER, operatingYear: 2024 },
    ];

    expect(getCurrentSeasonIds(seasons)).toEqual([2, 3]);
  });

  it("returns an empty array when given no seasons", () => {
    expect(getCurrentSeasonIds([])).toEqual([]);
  });
});
