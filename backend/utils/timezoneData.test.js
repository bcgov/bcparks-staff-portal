import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";

// BC moved to permanent UTC-7 on 2026-11-01 (tzdata 2026b).
// Node's built-in ICU tzdata must include this, or BC times will be an hour early.
describe("America/Vancouver timezone data", () => {
  it("uses UTC-7 in winter after 2026-11-01", () => {
    const bcDate = new TZDate("2026-12-15T12:00:00Z", "America/Vancouver");

    expect(format(bcDate, "yyyy-MM-dd HH:mm:ss")).toBe("2026-12-15 05:00:00");
  });

  it("still uses UTC-8 in winter before the change", () => {
    const bcDate = new TZDate("2025-12-15T12:00:00Z", "America/Vancouver");

    expect(format(bcDate, "yyyy-MM-dd HH:mm:ss")).toBe("2025-12-15 04:00:00");
  });
});
