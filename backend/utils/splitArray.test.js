import { describe, it, expect } from "vitest";
import splitArray from "./splitArray.js";

describe("splitArray", () => {
  it("returns a single chunk when items are well under maxBytes", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    expect(splitArray(items, 1000)).toEqual([items]);
  });

  it("splits into multiple chunks when items exceed maxBytes", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    // Each stringified item is ~8 bytes; force a split after ~2 items
    const chunks = splitArray(items, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flat()).toEqual(items);
  });

  it("returns an empty array when given no items", () => {
    expect(splitArray([])).toEqual([]);
  });

  it("still returns a chunk containing an oversized single item", () => {
    const items = [{ id: "x".repeat(50) }];

    expect(splitArray(items, 10)).toEqual([items]);
  });
});
