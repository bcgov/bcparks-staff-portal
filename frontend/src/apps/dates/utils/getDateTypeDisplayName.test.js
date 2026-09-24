import { describe, it, expect } from "vitest";
import getDateTypeDisplayName from "./getDateTypeDisplayName.js";

describe("getDateTypeDisplayName", () => {
  it('maps "Operation" to its display label', () => {
    expect(getDateTypeDisplayName("Operation")).toBe("Facility available");
  });

  it("passes through an unmapped date type name unchanged", () => {
    expect(getDateTypeDisplayName("Tier 1")).toBe("Tier 1");
  });

  it("passes through a missing argument unchanged", () => {
    expect(getDateTypeDisplayName()).toBeUndefined();
  });
});
