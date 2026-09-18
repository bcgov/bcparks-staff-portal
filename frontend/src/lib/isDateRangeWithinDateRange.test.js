import { describe, it, expect } from "vitest";
import isDateRangeWithinDateRange from "./isDateRangeWithinDateRange.js";

describe("isDateRangeWithinDateRange", () => {
  it("returns true when the inner range is fully within the outer range", () => {
    const outerDateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };
    const innerDateRange = {
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-01-20"),
    };

    expect(isDateRangeWithinDateRange(outerDateRange, innerDateRange)).toBe(
      true,
    );
  });

  it("returns false when the inner range extends past the outer range", () => {
    const outerDateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };
    const innerDateRange = {
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-02-05"),
    };

    expect(isDateRangeWithinDateRange(outerDateRange, innerDateRange)).toBe(
      false,
    );
  });

  it("returns true when the inner range exactly matches the outer range's boundaries", () => {
    const outerDateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };
    const innerDateRange = {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    };

    expect(isDateRangeWithinDateRange(outerDateRange, innerDateRange)).toBe(
      true,
    );
  });
});
