import test from "node:test";
import assert from "node:assert/strict";

import { getWinterFeeRangeWindow } from "./propagateWinterFeeDates.js";

function range(startDate, endDate) {
  return {
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  };
}

function isoDate(date) {
  return date?.toISOString().slice(0, 10);
}

function toIsoRanges(ranges) {
  return ranges.map((currentRange) => ({
    startDate: isoDate(currentRange.startDate),
    endDate: isoDate(currentRange.endDate),
  }));
}

function calculateFeatureWindows(parkWinterRanges, features) {
  return features
    .filter((feature) => feature.hasWinterFeeDates)
    .map((feature) => ({
      id: feature.id,
      ranges: getWinterFeeRangeWindow(
        parkWinterRanges,
        feature.previousOperationRanges,
        feature.currentOperationRanges,
      ),
    }));
}

test("1. returns empty ranges when operation dates do not overlap winter", () => {
  const ranges = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [],
  );

  assert.deepStrictEqual(ranges, []);
});

test("2. returns empty ranges when park winter dates are missing", () => {
  const ranges = getWinterFeeRangeWindow(
    [],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z")],
  );

  assert.deepStrictEqual(ranges, []);
});

test("3. clips overlap to operation end when park winter continues past it", () => {
  const ranges = getWinterFeeRangeWindow(
    [range("2026-09-01T00:00:00.000Z", "2027-05-31T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [],
  );

  assert.deepStrictEqual(toIsoRanges(ranges), [
    {
      startDate: "2026-09-01",
      endDate: "2026-10-15",
    },
  ]);
});

test("4. merges consecutive overlap segments into one range", () => {
  const ranges = getWinterFeeRangeWindow(
    [range("2026-12-01T00:00:00.000Z", "2027-03-31T00:00:00.000Z")],
    [range("2026-03-27T00:00:00.000Z", "2026-12-31T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-10-31T00:00:00.000Z")],
  );

  assert.deepStrictEqual(toIsoRanges(ranges), [
    {
      startDate: "2026-12-01",
      endDate: "2027-03-31",
    },
  ]);
});

test("5. keeps disjoint overlap segments instead of filling a winter gap", () => {
  const ranges = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-31T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-31T00:00:00.000Z")],
    [range("2027-02-01T00:00:00.000Z", "2027-10-31T00:00:00.000Z")],
  );

  assert.deepStrictEqual(toIsoRanges(ranges), [
    {
      startDate: "2026-10-16",
      endDate: "2026-10-31",
    },
    {
      startDate: "2027-02-01",
      endDate: "2027-03-31",
    },
  ]);
});

test("6. calculates winter ranges independently for each eligible feature", () => {
  const results = calculateFeatureWindows(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [
      {
        id: "feature-a",
        hasWinterFeeDates: true,
        previousOperationRanges: [
          range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z"),
        ],
        currentOperationRanges: [
          range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z"),
        ],
      },
      {
        id: "feature-b",
        hasWinterFeeDates: true,
        previousOperationRanges: [
          range("2026-01-01T00:00:00.000Z", "2026-12-31T00:00:00.000Z"),
        ],
        currentOperationRanges: [],
      },
    ],
  );

  const featureA = results.find((item) => item.id === "feature-a");
  const featureB = results.find((item) => item.id === "feature-b");

  assert.deepStrictEqual(toIsoRanges(featureA?.ranges || []), [
    {
      startDate: "2027-01-01",
      endDate: "2027-03-26",
    },
  ]);
  assert.deepStrictEqual(toIsoRanges(featureB?.ranges || []), [
    {
      startDate: "2026-10-16",
      endDate: "2026-12-31",
    },
  ]);
});

test("7. excludes features with hasWinterFeeDates set to false", () => {
  const results = calculateFeatureWindows(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [
      {
        id: "feature-a",
        hasWinterFeeDates: true,
        previousOperationRanges: [
          range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z"),
        ],
        currentOperationRanges: [
          range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z"),
        ],
      },
      {
        id: "feature-b",
        hasWinterFeeDates: false,
        previousOperationRanges: [
          range("2026-01-01T00:00:00.000Z", "2026-12-31T00:00:00.000Z"),
        ],
        currentOperationRanges: [
          range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z"),
        ],
      },
    ],
  );

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, "feature-a");
  assert.deepStrictEqual(toIsoRanges(results[0].ranges || []), [
    {
      startDate: "2027-01-01",
      endDate: "2027-03-26",
    },
  ]);
});
