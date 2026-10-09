import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateRange, Season, SeasonChangeLog } from "../../models/index.js";
import * as STATUS from "../../constants/seasonStatus.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { queueStrapiTask } from "../../utils/strapi/strapiTaskQueue.js";
import router from "./publish.js";

/** Capture route handlers without starting an HTTP server. */
vi.mock("express", () => ({
  Router: vi.fn(() => ({ get: vi.fn(), post: vi.fn() })),
}));

/** Keep the async route awaitable for focused handler tests. */
vi.mock("express-async-handler", () => ({ default: (handler) => handler }));

/** Permissions are outside this audit-snapshot regression's scope. */
vi.mock("../../middleware/permissions.js", () => ({
  checkPermissions: vi.fn(),
}));

vi.mock("../../models/index.js", () => ({
  Season: { findAll: vi.fn(), update: vi.fn() },
  DateRange: { findAll: vi.fn() },
  DateRangeAnnual: {},
  DateType: {},
  Dateable: {},
  Feature: {},
  FeatureType: {},
  GateDetail: {},
  Park: {},
  ParkArea: {},
  User: {},
  SeasonChangeLog: { bulkCreate: vi.fn() },
}));

vi.mock("../../utils/strapi/strapiTaskQueue.js", () => ({
  queueStrapiTask: vi.fn(),
}));

const gateDetail = {
  id: 96,
  publishableId: 84,
  hasGate: false,
  gateOpenTime: null,
  gateCloseTime: null,
  gateOpensAtDawn: false,
  gateClosesAtDusk: false,
  gateOpen24Hours: true,
};

const publishHandler = router.post.mock.calls
  .find(([path]) => path === "/publish-to-api/")
  .at(-1);

/** Reset model responses while retaining the registered route handler. */
beforeEach(() => {
  vi.clearAllMocks();
  DateRange.findAll.mockResolvedValue([]);
});

describe("publish gate snapshots", () => {
  it.each(["park", "parkArea", "feature"])(
    "logs complete database gate values for %s instead of an incomplete prior log",
    async (entityType) => {
      const entity = {
        orcs: "123",
        orcsAreaNumber: "123-1",
        orcsFeatureNumber: "123-2",
        dateableId: 12,
        gateDetails: {
          ...gateDetail,
          toJSON: vi.fn().mockReturnValue(gateDetail),
        },
        getFeatures: vi.fn().mockResolvedValue([]),
      };
      const season = {
        id: 1,
        publishableId: 84,
        operatingYear: 2026,
        seasonType: SEASON_TYPE.REGULAR,
        [entityType]: entity,
      };

      Season.findAll.mockResolvedValueOnce([season]).mockResolvedValueOnce([
        {
          id: 1,
          changeLogs: [{ gateDetailNewValue: { id: 96, publishableId: 84 } }],
        },
      ]);
      const res = { send: vi.fn() };

      await publishHandler({ body: { seasonIds: [1] }, user: { id: 2 } }, res);

      const query = Season.findAll.mock.calls[0][0];

      for (const association of query.include) {
        expect(association.include[0].attributes).toEqual(
          Object.keys(gateDetail),
        );
      }
      expect(
        entity.gateDetails.toJSON.mock.invocationCallOrder[0],
      ).toBeLessThan(Season.update.mock.invocationCallOrder[0]);
      expect(SeasonChangeLog.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          seasonId: 1,
          statusOldValue: STATUS.APPROVED,
          statusNewValue: STATUS.PUBLISHED,
          gateDetailOldValue: gateDetail,
          gateDetailNewValue: gateDetail,
        }),
      ]);
      expect(queueStrapiTask).toHaveBeenCalledOnce();
      expect(res.send).toHaveBeenCalledOnce();
    },
  );

  it.each([SEASON_TYPE.REGULAR, SEASON_TYPE.WINTER])(
    "logs null for %s seasons with no applicable gate snapshot",
    async (seasonType) => {
      Season.findAll
        .mockResolvedValueOnce([
          {
            id: 1,
            operatingYear: 2026,
            seasonType,
            park: {
              orcs: "123",
              gateDetails:
                seasonType === SEASON_TYPE.WINTER
                  ? {
                      ...gateDetail,
                      toJSON: vi.fn().mockReturnValue(gateDetail),
                    }
                  : null,
            },
          },
        ])
        .mockResolvedValueOnce([
          { id: 1, changeLogs: [{ gateDetailNewValue: gateDetail }] },
        ]);
      const res = { send: vi.fn() };

      await publishHandler({ body: { seasonIds: [1] }, user: { id: 2 } }, res);

      expect(SeasonChangeLog.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          gateDetailOldValue: null,
          gateDetailNewValue: null,
        }),
      ]);
    },
  );
});
