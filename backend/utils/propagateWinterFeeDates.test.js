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
