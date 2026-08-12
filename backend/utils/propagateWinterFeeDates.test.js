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

function calculateFeatureWindows(parkWinterRanges, features) {
  return features
    .filter((feature) => feature.hasWinterFeeDates)
    .map((feature) => ({
      id: feature.id,
      window: getWinterFeeRangeWindow(
        parkWinterRanges,
        feature.previousOperationRanges,
        feature.currentOperationRanges,
      ),
    }));
}

test("1. uses previous and current feature operation with current park winter season", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z")],
  );

  assert.strictEqual(isoDate(window?.startDate), "2027-01-01");
  assert.strictEqual(isoDate(window?.endDate), "2027-03-26");
});

test("2. uses current feature operation when no previous feature operation exists", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [],
    [range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z")],
  );

  assert.strictEqual(isoDate(window?.startDate), "2027-01-01");
  assert.strictEqual(isoDate(window?.endDate), "2027-03-26");
});

test("3. uses previous feature operation when current feature operation is missing", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [],
  );

  assert.strictEqual(window, null);
});

test("4. returns null when the current park winter season is missing", () => {
  const window = getWinterFeeRangeWindow(
    [],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-12-31T00:00:00.000Z")],
  );

  assert.strictEqual(window, null);
});

test("3A. returns overlap when previous operation season is longer and current season is missing", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-10-16T00:00:00.000Z", "2027-03-26T00:00:00.000Z")],
    [range("2026-01-01T00:00:00.000Z", "2026-12-31T00:00:00.000Z")],
    [],
  );

  assert.strictEqual(isoDate(window?.startDate), "2026-10-16");
  assert.strictEqual(isoDate(window?.endDate), "2026-12-31");
});

test("3B. returns overlap when park winter season is longer and current season is missing", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-09-01T00:00:00.000Z", "2027-05-31T00:00:00.000Z")],
    [range("2026-04-01T00:00:00.000Z", "2026-10-15T00:00:00.000Z")],
    [],
  );

  assert.strictEqual(isoDate(window?.startDate), "2026-09-01");
  assert.strictEqual(isoDate(window?.endDate), "2026-10-15");
});

test("5. computes overlap for Dec-to-Mar winter with 2026/2027 operation seasons", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-12-01T00:00:00.000Z", "2027-03-06T00:00:00.000Z")],
    [range("2026-03-27T00:00:00.000Z", "2026-11-30T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-10-31T00:00:00.000Z")],
  );

  assert.strictEqual(isoDate(window?.startDate), "2027-01-01");
  assert.strictEqual(isoDate(window?.endDate), "2027-03-06");
});

test("5B. preserves December start when previous operation reaches park winter start", () => {
  const window = getWinterFeeRangeWindow(
    [range("2026-12-01T00:00:00.000Z", "2027-03-31T00:00:00.000Z")],
    [range("2026-03-27T00:00:00.000Z", "2026-12-31T00:00:00.000Z")],
    [range("2027-01-01T00:00:00.000Z", "2027-10-31T00:00:00.000Z")],
  );

  assert.strictEqual(isoDate(window?.startDate), "2026-12-01");
  assert.strictEqual(isoDate(window?.endDate), "2027-03-31");
});

test("6A. two features with winter fee dates are calculated independently", () => {
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

  assert.strictEqual(isoDate(featureA?.window?.startDate), "2027-01-01");
  assert.strictEqual(isoDate(featureA?.window?.endDate), "2027-03-26");
  assert.strictEqual(isoDate(featureB?.window?.startDate), "2026-10-16");
  assert.strictEqual(isoDate(featureB?.window?.endDate), "2026-12-31");
});

test("6B. only one feature with winter fee dates is included in calculation", () => {
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
  assert.strictEqual(isoDate(results[0].window?.startDate), "2027-01-01");
  assert.strictEqual(isoDate(results[0].window?.endDate), "2027-03-26");
});
