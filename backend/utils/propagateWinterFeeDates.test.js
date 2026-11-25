import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";

import { DateRange, Feature, Season } from "../models/index.js";
import hasApprovedOperationSeasonForFeature from "./hasApprovedOperationSeasonForFeature.js";
import propagateWinterFeeDates, {
  clearWinterFeeDatesForUnflaggedParks,
  getRangesSignature,
} from "./propagateWinterFeeDates.js";

// Minimal in-memory tables, reset before each test
const db = { parks: [], parkAreas: [], features: [], seasons: [], ranges: [] };
let nextRangeId = 1;

/**
 * Returns whether a record matches a simple Sequelize where clause
 * (equality, Op.in and Op.ne only).
 * @param {Object} record Record to test
 * @param {Object} [where] Sequelize-style where clause
 * @returns {boolean} True when every condition matches
 */
function matches(record, where = {}) {
  return Object.entries(where).every(([key, condition]) => {
    const value = record[key];

    if (condition && typeof condition === "object") {
      if (Op.in in condition) return condition[Op.in].includes(value);
      if (Op.ne in condition) return value !== condition[Op.ne];
    }

    return value === condition;
  });
}

/**
 * Wraps a plain season so it behaves like a Sequelize instance.
 * @param {Object} season Season row
 * @returns {Object} Season with a mocked save()
 */
function seasonInstance(season) {
  return Object.assign(season, { save: season.save ?? vi.fn() });
}

/**
 * Wraps a plain range so it behaves like a Sequelize instance.
 * @param {Object} range DateRange row
 * @returns {Object} Range with toJSON()
 */
function rangeInstance(range) {
  return { ...range, toJSON: () => ({ ...range }) };
}

vi.mock("../models/index.js", () => ({
  DateType: {
    findOne: vi.fn(async ({ where }) => ({ id: where.dateTypeNumber })),
  },
  Park: {
    findByPk: vi.fn(async (id) => db.parks.find((park) => park.id === id)),
    findAll: vi.fn(async ({ where }) =>
      db.parks.filter((park) => matches(park, where)),
    ),
  },
  ParkArea: {},
  Feature: {
    findAll: vi.fn(async ({ where, include = [] }) => {
      const parkWhere = include.find((item) => item.as === "park")?.where;

      return db.features
        .filter((feature) => matches(feature, where))
        .map((feature) => ({
          ...feature,
          park: db.parks.find((park) => park.id === feature.parkId),
          parkArea:
            db.parkAreas.find((area) => area.id === feature.parkAreaId) ?? null,
        }))
        .filter((feature) => !parkWhere || matches(feature.park, parkWhere));
    }),
  },
  Season: {
    findByPk: vi.fn(async (id) => {
      const season = db.seasons.find((row) => row.id === id);

      if (!season) return null;

      return {
        ...season,
        park: db.parks.find(
          (park) => park.publishableId === season.publishableId,
        ),
        parkArea: null,
        feature: null,
      };
    }),
    findOne: vi.fn(async ({ where }) => {
      const season = db.seasons.find((row) => matches(row, where));

      return season ? seasonInstance(season) : null;
    }),
    findAll: vi.fn(async ({ where }) =>
      db.seasons.filter((row) => matches(row, where)).map(seasonInstance),
    ),
  },
  DateRange: {
    findAll: vi.fn(async ({ where, include = [] }) => {
      const seasonWhere = include[0]?.where;

      return db.ranges
        .filter((range) => matches(range, where))
        .filter((range) => {
          if (!seasonWhere) return true;

          const season = db.seasons.find((row) => row.id === range.seasonId);

          return season && matches(season, seasonWhere);
        })
        .map(rangeInstance);
    }),
    destroy: vi.fn(async ({ where }) => {
      const before = db.ranges.length;

      db.ranges = db.ranges.filter((range) => !matches(range, where));
      return before - db.ranges.length;
    }),
    bulkCreate: vi.fn(async (rows) => {
      db.ranges.push(...rows.map((row) => ({ id: nextRangeId++, ...row })));
    }),
  },
}));

vi.mock("./hasApprovedOperationSeasonForFeature.js", () => ({
  default: vi.fn(),
}));

// DateType IDs come from DateType.findOne mock: id === dateTypeNumber
const WINTER_FEE = 4;
const OPERATION = 6;

/**
 * Returns the Winter fee rows for a season/dateable pair.
 * @param {number} seasonId Season ID
 * @param {number} dateableId Dateable ID
 * @returns {Array<Object>} Matching rows
 */
function winterRows(seasonId, dateableId) {
  return db.ranges.filter(
    (range) =>
      range.seasonId === seasonId &&
      range.dateableId === dateableId &&
      range.dateTypeId === WINTER_FEE,
  );
}

/**
 * Adds a DateRange row to the fake table.
 * @param {Object} row DateRange fields
 * @returns {void}
 */
function addRange(row) {
  db.ranges.push({ id: nextRangeId++, ...row });
}

/**
 * Seeds one park (winter 2026) with:
 * - Feature 1: flagged, standalone (own winter season 600)
 * - Feature 2: winter flag off, with a stale derived row (season 700)
 * - Feature 3: flagged, in ParkArea 40 (season 800), with a stale row left on
 *   its former ParkArea's season 900
 */
beforeEach(() => {
  vi.clearAllMocks();
  nextRangeId = 1;
  db.ranges = [];

  db.parks = [
    { id: 1, publishableId: 10, dateableId: 100, hasWinterFeeDates: true },
  ];
  db.parkAreas = [
    { id: 4, publishableId: 40, dateableId: 401 },
    { id: 5, publishableId: 50, dateableId: 501 },
  ];
  db.features = [
    {
      id: 1,
      name: "Flagged",
      parkId: 1,
      publishableId: 20,
      dateableId: 200,
      parkAreaId: null,
      hasWinterFeeDates: true,
      active: true,
    },
    {
      id: 2,
      name: "Unflagged",
      parkId: 1,
      publishableId: 30,
      dateableId: 300,
      parkAreaId: null,
      hasWinterFeeDates: false,
      active: true,
    },
    {
      id: 3,
      name: "Moved",
      parkId: 1,
      publishableId: null,
      dateableId: 400,
      parkAreaId: 4,
      hasWinterFeeDates: true,
      active: true,
    },
  ];

  const winter = { operatingYear: 2026, seasonType: "winter" };

  db.seasons = [
    {
      id: 500,
      publishableId: 10,
      status: "approved",
      readyToPublish: true,
      ...winter,
    },
    {
      id: 600,
      publishableId: 20,
      status: "published",
      readyToPublish: true,
      ...winter,
    },
    {
      id: 700,
      publishableId: 30,
      status: "published",
      readyToPublish: true,
      ...winter,
    },
    {
      id: 800,
      publishableId: 40,
      status: "published",
      readyToPublish: true,
      ...winter,
    },
    {
      id: 900,
      publishableId: 50,
      status: "published",
      readyToPublish: true,
      ...winter,
    },
    // Regular seasons that supply Operation dates
    {
      id: 610,
      publishableId: 20,
      status: "approved",
      operatingYear: 2026,
      seasonType: "regular",
    },
    {
      id: 611,
      publishableId: 20,
      status: "approved",
      operatingYear: 2027,
      seasonType: "regular",
    },
    {
      id: 810,
      publishableId: 40,
      status: "approved",
      operatingYear: 2027,
      seasonType: "regular",
    },
  ];

  // Park-level source Winter fee dates
  addRange({
    seasonId: 500,
    dateableId: 100,
    dateTypeId: WINTER_FEE,
    startDate: "2026-11-01",
    endDate: "2027-03-31",
  });
  // Operation dates
  addRange({
    seasonId: 610,
    dateableId: 200,
    dateTypeId: OPERATION,
    startDate: "2026-05-01",
    endDate: "2026-11-30",
  });
  addRange({
    seasonId: 611,
    dateableId: 200,
    dateTypeId: OPERATION,
    startDate: "2027-03-01",
    endDate: "2027-10-31",
  });
  addRange({
    seasonId: 810,
    dateableId: 400,
    dateTypeId: OPERATION,
    startDate: "2027-01-01",
    endDate: "2027-10-31",
  });
  // Stale derived rows
  addRange({
    seasonId: 700,
    dateableId: 300,
    dateTypeId: WINTER_FEE,
    startDate: "2026-11-01",
    endDate: "2026-12-31",
  });
  addRange({
    seasonId: 900,
    dateableId: 400,
    dateTypeId: WINTER_FEE,
    startDate: "2026-11-01",
    endDate: "2026-12-31",
  });

  hasApprovedOperationSeasonForFeature.mockResolvedValue(true);
});

describe("propagateWinterFeeDates", () => {
  it("clears stale derived rows and rebuilds flagged Features", async () => {
    await propagateWinterFeeDates(500);

    // Flag turned off: cleared
    expect(winterRows(700, 300)).toEqual([]);
    // Moved Feature: old ParkArea season cleared, current owner rebuilt
    expect(winterRows(900, 400)).toEqual([]);
    expect(winterRows(800, 400)).toHaveLength(1);
    expect(winterRows(800, 400)[0].startDate).not.toBeNull();
    // Flagged Feature: winter window overlaps both operating seasons
    expect(getRangesSignature(winterRows(600, 200))).toBe(
      getRangesSignature([
        { startDate: "2026-11-01", endDate: "2026-11-30" },
        { startDate: "2027-03-01", endDate: "2027-03-31" },
      ]),
    );
    // Park source dates untouched
    expect(winterRows(500, 100)).toHaveLength(1);
  });

  it("clears an inactive Feature's derived rows", async () => {
    db.features[0].active = false;
    addRange({
      seasonId: 600,
      dateableId: 200,
      dateTypeId: WINTER_FEE,
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });

    await propagateWinterFeeDates(500);

    expect(winterRows(600, 200)).toEqual([]);
  });

  it("treats Features sharing a ParkArea season independently", async () => {
    // Unflagged Feature in the same ParkArea (season 800) as flagged Feature 3
    db.features.push({
      id: 4,
      name: "Unflagged sibling",
      parkId: 1,
      publishableId: null,
      dateableId: 410,
      parkAreaId: 4,
      hasWinterFeeDates: false,
      active: true,
    });
    addRange({
      seasonId: 800,
      dateableId: 410,
      dateTypeId: WINTER_FEE,
      startDate: "2026-11-01",
      endDate: "2026-12-31",
    });

    await propagateWinterFeeDates(500);

    // Only the unflagged Feature's rows are cleared; the flagged sibling is calculated
    expect(winterRows(800, 410)).toEqual([]);
    expect(winterRows(800, 400)).toHaveLength(1);
    expect(winterRows(800, 400)[0].startDate).not.toBeNull();
  });

  it("resets derived dates to placeholders when the Park winter season isn't approved", async () => {
    addRange({
      seasonId: 600,
      dateableId: 200,
      dateTypeId: WINTER_FEE,
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });
    db.seasons.find((season) => season.id === 500).status = "requested";

    await propagateWinterFeeDates(500);

    expect(winterRows(600, 200)).toEqual([
      expect.objectContaining({ startDate: null, endDate: null }),
    ]);
    expect(winterRows(800, 400)).toEqual([
      expect.objectContaining({ startDate: null, endDate: null }),
    ]);
    expect(winterRows(700, 300)).toEqual([]);
    expect(winterRows(500, 100)).toHaveLength(1);

    // Derived season status is left alone on a clear-only pass
    const featureSeason = db.seasons.find((season) => season.id === 600);

    expect(featureSeason.status).toBe("published");
    expect(featureSeason.save).not.toHaveBeenCalled();
  });

  it("doesn't recreate derived dates for a Park with the flag off", async () => {
    // Approved Park winter dates are kept after the flag is turned off
    db.parks[0].hasWinterFeeDates = false;

    await propagateWinterFeeDates(500);

    expect(winterRows(600, 200)).toEqual([
      expect.objectContaining({ startDate: null, endDate: null }),
    ]);
    expect(winterRows(800, 400)).toEqual([
      expect.objectContaining({ startDate: null, endDate: null }),
    ]);
    expect(winterRows(700, 300)).toEqual([]);
    // Park source dates and derived season status untouched
    expect(winterRows(500, 100)).toHaveLength(1);
    expect(db.seasons.find((season) => season.id === 600).status).toBe(
      "published",
    );
  });

  it("resets a Feature without an approved Operation season to a placeholder", async () => {
    addRange({
      seasonId: 600,
      dateableId: 200,
      dateTypeId: WINTER_FEE,
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });
    hasApprovedOperationSeasonForFeature.mockImplementation(
      async (feature) => feature.id !== 1,
    );

    await propagateWinterFeeDates(500);

    expect(winterRows(600, 200)).toEqual([
      expect.objectContaining({ startDate: null, endDate: null }),
    ]);
  });

  it("leaves rows and season status alone when nothing changed", async () => {
    await propagateWinterFeeDates(500);

    const rangeIds = db.ranges.map((range) => range.id);

    db.seasons.forEach((season) => {
      if (season.save) season.save.mockClear();
      if (season.seasonType === "winter" && season.id !== 500) {
        season.status = "published";
      }
    });
    DateRange.bulkCreate.mockClear();

    await propagateWinterFeeDates(500);

    // Same row IDs: nothing was deleted and re-created
    expect(db.ranges.map((range) => range.id)).toEqual(rangeIds);
    expect(DateRange.bulkCreate).not.toHaveBeenCalled();
    expect(db.seasons.find((season) => season.id === 600).status).toBe(
      "published",
    );
  });

  it("syncs derived season state when the dates change", async () => {
    await propagateWinterFeeDates(500);

    const featureSeason = db.seasons.find((season) => season.id === 600);

    expect(featureSeason.status).toBe("approved");
    expect(featureSeason.save).toHaveBeenCalled();
  });

  it("syncs readyToPublish when it changes but the dates don't", async () => {
    await propagateWinterFeeDates(500);

    const rangeIds = db.ranges.map((range) => range.id);

    // Park marked not ready; calculated overlaps stay the same
    db.seasons.find((season) => season.id === 500).readyToPublish = false;

    await propagateWinterFeeDates(500);

    // Dates untouched, readiness copied to standalone and ParkArea seasons
    expect(db.ranges.map((range) => range.id)).toEqual(rangeIds);
    expect(db.seasons.find((season) => season.id === 600).readyToPublish).toBe(
      false,
    );
    expect(db.seasons.find((season) => season.id === 800).readyToPublish).toBe(
      false,
    );
  });
});

describe("clearWinterFeeDatesForUnflaggedParks", () => {
  it("clears every Feature's derived rows for Parks with the flag off", async () => {
    db.parks[0].hasWinterFeeDates = false;
    addRange({
      seasonId: 600,
      dateableId: 200,
      dateTypeId: WINTER_FEE,
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });

    const deleted = await clearWinterFeeDatesForUnflaggedParks(2026);

    expect(deleted).toBe(3);
    expect(winterRows(600, 200)).toEqual([]);
    expect(winterRows(700, 300)).toEqual([]);
    expect(winterRows(900, 400)).toEqual([]);
    expect(winterRows(500, 100)).toHaveLength(1);
    expect(Season.findOne).not.toHaveBeenCalled();
  });

  it("ignores other operating years", async () => {
    db.parks[0].hasWinterFeeDates = false;

    expect(await clearWinterFeeDatesForUnflaggedParks(2025)).toBe(0);
  });

  it("does nothing for Parks with the flag on", async () => {
    expect(await clearWinterFeeDatesForUnflaggedParks(2026)).toBe(0);
    expect(winterRows(700, 300)).toHaveLength(1);
  });

  it("keeps placeholders for flagged Features but not unflagged ones", async () => {
    db.parks[0].hasWinterFeeDates = false;
    db.ranges = db.ranges.filter(
      (range) => range.dateTypeId !== WINTER_FEE || range.dateableId === 100,
    );
    // Placeholder that createWinterSeasons re-adds for flagged Feature 1
    addRange({
      seasonId: 600,
      dateableId: 200,
      dateTypeId: WINTER_FEE,
      startDate: null,
      endDate: null,
    });
    // Leftover placeholder for unflagged Feature 2
    addRange({
      seasonId: 700,
      dateableId: 300,
      dateTypeId: WINTER_FEE,
      startDate: null,
      endDate: null,
    });

    const deleted = await clearWinterFeeDatesForUnflaggedParks(2026);

    expect(deleted).toBe(1);
    expect(winterRows(600, 200)).toHaveLength(1);
    expect(winterRows(700, 300)).toEqual([]);
    expect(DateRange.destroy).toHaveBeenCalledTimes(1);
  });

  it("runs the same number of queries regardless of Park count", async () => {
    db.parks[0].hasWinterFeeDates = false;
    db.parks.push({
      id: 2,
      publishableId: 11,
      dateableId: 101,
      hasWinterFeeDates: false,
    });

    await clearWinterFeeDatesForUnflaggedParks(2026);

    expect(Feature.findAll).toHaveBeenCalledTimes(1);
    expect(DateRange.findAll).toHaveBeenCalledTimes(1);
  });
});

describe("getRangesSignature", () => {
  it("compares Date and string dates by UTC day, ignoring order", () => {
    expect(
      getRangesSignature([
        { startDate: "2027-03-01", endDate: "2027-03-31" },
        { startDate: new Date("2026-11-01T00:00:00Z"), endDate: "2026-11-30" },
      ]),
    ).toBe(
      getRangesSignature([
        { startDate: "2026-11-01", endDate: "2026-11-30" },
        { startDate: "2027-03-01", endDate: "2027-03-31" },
      ]),
    );
  });

  it("distinguishes placeholders from dated ranges", () => {
    expect(getRangesSignature([{ startDate: null, endDate: null }])).not.toBe(
      getRangesSignature([]),
    );
  });
});
