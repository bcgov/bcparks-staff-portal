import { describe, it, expect } from "vitest";
import { formatServerErrorTimestamp } from "./index.js";

describe("formatServerErrorTimestamp", () => {
  it("formats the time at a fixed UTC-7, regardless of the local timezone", () => {
    expect(formatServerErrorTimestamp(new Date("2026-12-15T19:22:58Z"))).toBe(
      "2026-12-15 12:22:58 PM PCT",
    );
  });
});
