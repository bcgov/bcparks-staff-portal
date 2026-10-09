import { describe, it, expect } from "vitest";
import getEditableFormList from "./getEditableFormList.js";
import {
  shouldShowTiersAndGateSection,
  shouldShowWinterFeeSection,
} from "./submitPageFilters.js";
import * as STATUS from "@/constants/seasonStatus.js";

const trailType = { name: "Trail", featureTypeNumber: 1 };
const sortOrder = [
  { type: "ParkAreaType", parkAreaTypeNumber: 1 },
  { type: "FeatureType", ...trailType },
];

function createPark(id = 1) {
  return {
    id,
    matchesFilters: true,
    showTiersAndGate: true,
    showWinterFee: true,
    hasWinterFeeDates: true,
    currentSeason: {
      regular: { id: id * 10, status: STATUS.APPROVED.value },
      winter: { id: id * 10 + 1, status: STATUS.PUBLISHED.value },
    },
    parkAreas: [],
    features: [],
  };
}

describe("getEditableFormList result counts", () => {
  it("counts two Trail seasons without counting their park containers", () => {
    const filters = {
      featureTypes: [trailType],
      status: [],
      dateTypes: [],
      isInReservationSystem: false,
    };
    const parks = [createPark(1), createPark(2)].map((park) => ({
      ...park,
      showTiersAndGate: shouldShowTiersAndGateSection(park, filters),
      showWinterFee: shouldShowWinterFeeSection(park, filters),
      features: [
        {
          featureType: trailType,
          currentSeason: { regular: { id: park.id * 10 + 2 } },
        },
      ],
    }));

    const forms = getEditableFormList(parks, sortOrder);

    expect(forms).toHaveLength(2);
    expect(
      forms.map(({ seasonId, level, parkId }) => ({ seasonId, level, parkId })),
    ).toEqual([
      { seasonId: 12, level: "feature", parkId: 1 },
      { seasonId: 22, level: "feature", parkId: 2 },
    ]);
  });

  it("counts both visible park seasons, including approved and published seasons", () => {
    const forms = getEditableFormList([createPark()], sortOrder);

    expect(forms.map(({ seasonId }) => seasonId)).toEqual([10, 11]);
  });

  it.each([
    [true, false, 10],
    [false, true, 11],
  ])(
    "counts only the visible park season (%s, %s)",
    (showTiersAndGate, showWinterFee, seasonId) => {
      const park = { ...createPark(), showTiersAndGate, showWinterFee };

      expect(
        getEditableFormList([park], sortOrder).map((form) => form.seasonId),
      ).toEqual([seasonId]);
    },
  );

  it("retains child season results when the park's own seasons do not match", () => {
    const park = {
      ...createPark(),
      matchesFilters: false,
      features: [
        {
          featureType: trailType,
          currentSeason: {
            regular: { id: 12, status: STATUS.REQUESTED.value },
          },
        },
      ],
    };

    expect(getEditableFormList([park], sortOrder)).toMatchObject([
      {
        seasonId: 12,
        level: "feature",
        status: STATUS.REQUESTED.value,
        parkId: 1,
      },
    ]);
  });

  it("counts an area's season once rather than its nested feature date rows", () => {
    const park = {
      ...createPark(),
      showTiersAndGate: false,
      showWinterFee: false,
      parkAreas: [
        {
          parkAreaType: { parkAreaTypeNumber: 1 },
          currentSeason: {
            regular: { id: 13, status: STATUS.REQUESTED.value },
          },
          features: [{ id: 100 }, { id: 101 }],
        },
      ],
    };

    expect(getEditableFormList([park], sortOrder)).toMatchObject([
      {
        seasonId: 13,
        level: "park-area",
        status: STATUS.REQUESTED.value,
        parkId: 1,
      },
    ]);
  });

  it("does not count missing seasons or rows before the sort order loads", () => {
    const park = {
      ...createPark(),
      currentSeason: { regular: null, winter: {} },
      features: [{ featureType: trailType, currentSeason: { regular: null } }],
    };

    expect(getEditableFormList([park], sortOrder)).toHaveLength(0);
    expect(getEditableFormList([createPark()], [])).toHaveLength(0);
  });
});
