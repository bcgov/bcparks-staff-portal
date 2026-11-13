import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const axiosGet = vi.fn();

vi.mock("axios", () => ({ default: { get: axiosGet } }));

const { addBCBusinessDays, loadHolidays, preloadHolidays, clearHolidayCache } =
  await import("./statutoryHoliday.js");

// Subset of the canada-holidays.ca BC responses (with optional=true)
const HOLIDAYS = {
  2026: [
    { date: "2026-11-11", observedDate: "2026-11-11" }, // Remembrance Day
    { date: "2026-12-25", observedDate: "2026-12-25" }, // Christmas Day
    { date: "2026-12-26", observedDate: "2026-12-28" }, // Boxing Day (Saturday)
  ],
  2027: [
    { date: "2027-01-01", observedDate: "2027-01-01" }, // New Year's Day
    { date: "2027-12-25", observedDate: "2027-12-27" }, // Christmas Day (Saturday)
    { date: "2027-12-26", observedDate: "2027-12-28" }, // Boxing Day (Sunday)
  ],
};

/**
 * Mocks the holiday API to return the HOLIDAYS fixture for the requested year.
 * @returns {void}
 */
function mockHolidayApi() {
  axiosGet.mockImplementation(async (url, { params }) => ({
    data: { province: { holidays: HOLIDAYS[params.year] } },
  }));
}

/**
 * Returns the years requested from the holiday API.
 * @returns {Array<number>} Requested years
 */
function requestedYears() {
  return axiosGet.mock.calls.map(([, options]) => options.params.year);
}

beforeEach(() => {
  clearHolidayCache();
  axiosGet.mockReset();
  mockHolidayApi();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.STAT_HOLIDAY_API;
  vi.restoreAllMocks();
});

describe("addBCBusinessDays with holidays loaded", () => {
  beforeEach(async () => {
    await Promise.all([loadHolidays(2026), loadHolidays(2027)]);
    axiosGet.mockClear();
  });

  it("adds business days within a week", async () => {
    // Monday -> Thursday
    expect(await addBCBusinessDays(new Date("2026-11-02T20:00:00Z"), 3)).toBe(
      "2026-11-05",
    );
  });

  it("skips weekends", async () => {
    // Friday -> Wednesday
    expect(await addBCBusinessDays(new Date("2026-10-30T20:00:00Z"), 3)).toBe(
      "2026-11-04",
    );
  });

  it("skips holidays", async () => {
    // Monday -> Friday, skipping Remembrance Day on Wednesday
    expect(await addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3)).toBe(
      "2026-11-13",
    );
  });

  it("skips the observed dates of holidays that fall on a weekend", async () => {
    // Thursday -> Thursday: Christmas and Boxing Day 2027 are observed Mon/Tue
    expect(await addBCBusinessDays(new Date("2027-12-23T20:00:00Z"), 3)).toBe(
      "2027-12-30",
    );
  });

  it("uses both years' holidays across the year boundary", async () => {
    // Wednesday -> Tuesday, skipping New Year's Day 2027
    expect(await addBCBusinessDays(new Date("2026-12-30T20:00:00Z"), 3)).toBe(
      "2027-01-05",
    );
  });

  it("counts from the current date in BC, not UTC", async () => {
    // Friday 03:30 UTC is Thursday evening in BC: Thursday -> Tuesday
    expect(await addBCBusinessDays(new Date("2026-10-30T03:30:00Z"), 3)).toBe(
      "2026-11-03",
    );
  });

  it("doesn't request cached years again", async () => {
    await addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3);
    await addBCBusinessDays(new Date("2026-12-30T20:00:00Z"), 3);

    expect(axiosGet).not.toHaveBeenCalled();
  });
});

describe("addBCBusinessDays without holidays loaded", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the year's holidays to load", async () => {
    // Monday -> Friday, skipping Remembrance Day on Wednesday
    expect(await addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3)).toBe(
      "2026-11-13",
    );
    expect(requestedYears()).toEqual([2026]);
  });

  it("loads both years at the same time across the year boundary", async () => {
    // Wednesday -> Tuesday, skipping New Year's Day 2027
    expect(await addBCBusinessDays(new Date("2026-12-30T20:00:00Z"), 3)).toBe(
      "2027-01-05",
    );
    expect(requestedYears()).toEqual([2026, 2027]);
  });

  it("stops waiting after 2 seconds and only skips weekends", async () => {
    vi.useFakeTimers();

    let respond;

    axiosGet.mockImplementationOnce(
      (url, { params }) =>
        new Promise((resolve) => {
          respond = () =>
            resolve({
              data: { province: { holidays: HOLIDAYS[params.year] } },
            });
        }),
    );

    const result = addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3);

    await vi.advanceTimersByTimeAsync(2000);

    // Monday -> Thursday: Remembrance Day isn't skipped
    expect(await result).toBe("2026-11-12");

    // The lookup finishes in the background and is used by later saves
    respond();
    await loadHolidays(2026);

    expect(await addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3)).toBe(
      "2026-11-13",
    );
    expect(axiosGet).toHaveBeenCalledTimes(1);
  });
});

describe("loadHolidays", () => {
  it("requests BC holidays including optional ones", async () => {
    await loadHolidays(2026);

    expect(axiosGet).toHaveBeenCalledWith(
      "https://canada-holidays.ca/api/v1/provinces/BC",
      expect.objectContaining({ params: { year: 2026, optional: true } }),
    );
  });

  it("uses the STAT_HOLIDAY_API environment variable when set", async () => {
    process.env.STAT_HOLIDAY_API = "https://holidays.example.com/BC";

    await loadHolidays(2026);

    expect(axiosGet.mock.calls[0][0]).toBe("https://holidays.example.com/BC");
  });

  it("only requests a year once while a lookup is in progress", async () => {
    await Promise.all([loadHolidays(2026), loadHolidays(2026)]);

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it("logs an error when the lookup fails, and retries on the next load", async () => {
    axiosGet.mockRejectedValueOnce(new Error("timeout of 5000ms exceeded"));

    await loadHolidays(2026);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Unable to load 2026 statutory holidays"),
      "timeout of 5000ms exceeded",
    );

    await loadHolidays(2026);

    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect(await addBCBusinessDays(new Date("2026-11-09T20:00:00Z"), 3)).toBe(
      "2026-11-13",
    );
  });
});

describe("preloadHolidays", () => {
  it("loads the current and next year in BC time", () => {
    // 2027-01-01 03:00 UTC is still 2026 in BC
    preloadHolidays(new Date("2027-01-01T03:00:00Z"));

    expect(requestedYears()).toEqual([2026, 2027]);
  });
});
