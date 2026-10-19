import { afterEach, describe, expect, it, vi } from "vitest";
import { validateStrapiFeatures } from "./validation.js";

vi.mock("../../../models/index.js", () => ({
  Feature: {},
}));

describe("validateStrapiFeatures", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a populated park area belonging to a different protected area", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      validateStrapiFeatures([
        {
          id: 1,
          parkFeatureName: "All sites",
          orcsFeatureNumber: "117-1",
          protectedArea: { orcs: 117 },
          parkArea: { orcsAreaNumber: "188-1" },
        },
      ]),
    ).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      'Invalid Strapi ParkFeature: All sites (1) - orcsAreaNumber "188-1" does not start with expected prefix "117-"',
    );
  });

  it("accepts a populated park area belonging to the same protected area", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      validateStrapiFeatures([
        {
          id: 1,
          parkFeatureName: "All sites",
          orcsFeatureNumber: "117-1",
          protectedArea: { orcs: 117 },
          parkArea: { orcsAreaNumber: "117-2" },
        },
      ]),
    ).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { parkArea: null },
    { parkArea: {} },
    { parkArea: { orcsAreaNumber: null } },
  ])(
    "accepts an optional park area without an identifier: %j",
    (optionalParkArea) => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(
        validateStrapiFeatures([
          {
            id: 1,
            parkFeatureName: "All sites",
            orcsFeatureNumber: "117-1",
            protectedArea: { orcs: 117 },
            ...optionalParkArea,
          },
        ]),
      ).toBe(true);
      expect(errorSpy).not.toHaveBeenCalled();
    },
  );
});
