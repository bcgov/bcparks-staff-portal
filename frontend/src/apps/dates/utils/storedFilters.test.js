import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FILTERS_STORAGE_KEY,
  DEFAULT_FILTERS,
  isValidStoredFilters,
  deserializeFilters,
} from "./storedFilters.js";

const savedFilters = {
  ...DEFAULT_FILTERS,
  name: "Golden Ears",
  status: ["approved"],
  isInReservationSystem: true,
};

describe("isValidStoredFilters", () => {
  it("accepts filters with the current names and value types", () => {
    expect(isValidStoredFilters(DEFAULT_FILTERS)).toBe(true);
    expect(isValidStoredFilters(savedFilters)).toBe(true);
  });

  it("rejects filters with a missing, renamed or extra filter name", () => {
    const { sections, ...missing } = DEFAULT_FILTERS;

    expect(sections).toEqual([]);
    expect(isValidStoredFilters(missing)).toBe(false);
    expect(isValidStoredFilters({ ...missing, parkSections: [] })).toBe(false);
    expect(isValidStoredFilters({ ...DEFAULT_FILTERS, region: [] })).toBe(
      false,
    );
  });

  it("rejects filters with a changed value type", () => {
    expect(isValidStoredFilters({ ...DEFAULT_FILTERS, status: "" })).toBe(
      false,
    );
  });

  it("rejects non-object values", () => {
    expect(isValidStoredFilters(null)).toBe(false);
    expect(isValidStoredFilters([])).toBe(false);
    expect(isValidStoredFilters("filters")).toBe(false);
  });
});

describe("deserializeFilters", () => {
  const removeItem = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: { removeItem } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    removeItem.mockReset();
  });

  it("loads valid persisted filters", () => {
    expect(deserializeFilters(JSON.stringify(savedFilters))).toEqual(
      savedFilters,
    );
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("clears persisted filters with outdated names and returns defaults", () => {
    const outdated = { ...savedFilters, parkName: "Golden Ears" };

    delete outdated.name;

    expect(deserializeFilters(JSON.stringify(outdated))).toBe(DEFAULT_FILTERS);
    expect(removeItem).toHaveBeenCalledWith(FILTERS_STORAGE_KEY);
  });

  it("clears unparseable values and returns defaults", () => {
    expect(deserializeFilters("{not json")).toBe(DEFAULT_FILTERS);
    expect(removeItem).toHaveBeenCalledWith(FILTERS_STORAGE_KEY);
  });
});
