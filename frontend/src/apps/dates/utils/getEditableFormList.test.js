import { describe, it, expect } from "vitest";
import getEditableFormList, { findNextForm } from "./getEditableFormList.js";
import {
  shouldShowTiersAndGateSection,
  shouldShowWinterFeeSection,
} from "./submitPageFilters.js";
import * as DATE_TYPE from "@/apps/dates/constants/dateType.js";
import * as FEATURE_TYPE from "@/apps/dates/constants/featureType.js";
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

describe("shouldShowWinterFeeSection feature type filter", () => {
  function filters(featureTypes) {
    return {
      featureTypes,
      status: [],
      dateTypes: [],
      isInReservationSystem: false,
    };
  }

  it("shows the section when Frontcountry campground is selected", () => {
    const frontcountry = {
      name: "Renamed in Strapi",
      featureTypeNumber: FEATURE_TYPE.FRONTCOUNTRY_CAMPGROUND,
    };

    expect(
      shouldShowWinterFeeSection(createPark(), filters([frontcountry])),
    ).toBe(true);
  });

  it("hides the section when only other feature types are selected", () => {
    const groupCampground = {
      name: "Frontcountry campground",
      featureTypeNumber: FEATURE_TYPE.GROUP_CAMPGROUND,
    };

    expect(
      shouldShowWinterFeeSection(createPark(), filters([groupCampground])),
    ).toBe(false);
  });
});

describe("park sections with status and date type filters combined", () => {
  const rsReviewSeason = {
    status: STATUS.PENDING_REVIEW.value,
    requiresReservationSvcApproval: true,
    reservationSvcApproved: false,
  };
  const winterFeeFilters = {
    featureTypes: [],
    status: [STATUS.RS_REVIEW_FILTER.value],
    dateTypes: [{ dateTypeNumber: DATE_TYPE.WINTER_FEE }],
    isInReservationSystem: false,
  };

  function parkWithSeasons(regular, winter) {
    return {
      ...createPark(),
      hasTier1Dates: true,
      currentSeason: { regular, winter },
    };
  }

  it("hides the Tiers and gate section even when its season is in RS review", () => {
    const park = parkWithSeasons(rsReviewSeason, {
      status: STATUS.REQUESTED.value,
    });

    expect(shouldShowTiersAndGateSection(park, winterFeeFilters)).toBe(false);
  });

  it("hides the Winter fee section when its season isn't in RS review", () => {
    const park = parkWithSeasons(rsReviewSeason, {
      status: STATUS.REQUESTED.value,
    });

    expect(shouldShowWinterFeeSection(park, winterFeeFilters)).toBe(false);
  });

  it("shows only the Winter fee section when its season is in RS review", () => {
    const park = parkWithSeasons(
      { status: STATUS.REQUESTED.value },
      rsReviewSeason,
    );

    expect(shouldShowTiersAndGateSection(park, winterFeeFilters)).toBe(false);
    expect(shouldShowWinterFeeSection(park, winterFeeFilters)).toBe(true);
  });

  it("hides the Winter fee section when its status matches but another date type is selected", () => {
    const park = parkWithSeasons(rsReviewSeason, rsReviewSeason);
    const filters = {
      ...winterFeeFilters,
      dateTypes: [{ dateTypeNumber: DATE_TYPE.TIER_1 }],
    };

    expect(shouldShowTiersAndGateSection(park, filters)).toBe(true);
    expect(shouldShowWinterFeeSection(park, filters)).toBe(false);
  });
});

describe("findNextForm", () => {
  function form(seasonId, status, approvals = {}) {
    return {
      seasonId,
      level: "feature",
      status,
      informationSvcApproved: false,
      reservationSvcApproved: false,
      ...approvals,
    };
  }

  const formList = [
    form(1, STATUS.REQUESTED.value),
    form(2, STATUS.APPROVED.value),
    form(3, STATUS.PUBLISHED.value),
    form(4, STATUS.PENDING_REVIEW.value),
  ];

  it("skips approved and published forms", () => {
    expect(findNextForm(formList, 1)).toEqual(formList[3]);
  });

  it.each([2, 3])(
    "returns null when the current form is approved or published (%s)",
    (seasonId) => {
      expect(findNextForm(formList, seasonId)).toBeNull();
    },
  );

  it("returns null at the end of the list or when the current form isn't in it", () => {
    expect(findNextForm(formList, 4)).toBeNull();
    expect(findNextForm(formList, 99)).toBeNull();
    expect(findNextForm(null, 1)).toBeNull();
  });

  it("skips forms the user's approval team has already approved", () => {
    const list = [
      form(1, STATUS.PENDING_REVIEW.value),
      form(2, STATUS.PENDING_REVIEW.value, { reservationSvcApproved: true }),
      form(3, STATUS.PENDING_REVIEW.value, { informationSvcApproved: true }),
    ];

    expect(findNextForm(list, 1, { isReservationSvcApprover: true })).toEqual(
      list[2],
    );
    expect(findNextForm(list, 1, { isInformationSvcApprover: true })).toEqual(
      list[1],
    );
    // Users on both teams still need to give the missing approval
    expect(
      findNextForm(list, 1, {
        isInformationSvcApprover: true,
        isReservationSvcApprover: true,
      }),
    ).toEqual(list[1]);
    // Users without a team role don't skip pending forms
    expect(findNextForm(list, 1)).toEqual(list[1]);
  });
});
