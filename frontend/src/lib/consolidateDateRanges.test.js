import { describe, it, expect } from "vitest";
import consolidateDateRanges from "./consolidateDateRanges.js";

describe("consolidateDateRanges", () => {
  it("merges overlapping ranges into one", () => {
    const ranges = [
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-10") },
      { startDate: new Date("2024-01-05"), endDate: new Date("2024-01-15") },
    ];

    expect(consolidateDateRanges(ranges)).toEqual([
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-15") },
    ]);
  });

  it("returns an empty array when given an empty array", () => {
    expect(consolidateDateRanges([])).toEqual([]);
  });

  it("combines adjacent ranges by default, but keeps them separate when combineAdjacent is false", () => {
    const ranges = [
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-02") },
      { startDate: new Date("2024-01-03"), endDate: new Date("2024-01-04") },
    ];

    expect(consolidateDateRanges(ranges)).toEqual([
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-04") },
    ]);

    expect(consolidateDateRanges(ranges, false)).toEqual([
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-02") },
      { startDate: new Date("2024-01-03"), endDate: new Date("2024-01-04") },
    ]);
  });
});
