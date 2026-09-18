import { describe, it, expect } from "vitest";
import isDateTypeOptional from "./isDateTypeOptional.js";
import * as DATE_TYPE from "../constants/dateType.js";

describe("isDateTypeOptional", () => {
  it("returns true for a date type listed as optional for the level", () => {
    expect(isDateTypeOptional(DATE_TYPE.TIER_2, "park")).toBe(true);
  });

  it("returns false for a date type not listed as optional for the level", () => {
    expect(isDateTypeOptional(DATE_TYPE.OPERATION, "park")).toBe(false);
  });

  it("returns false for a level with no entry in the optional types map", () => {
    expect(isDateTypeOptional(DATE_TYPE.TIER_2, "unknownLevel")).toBe(false);
  });
});
