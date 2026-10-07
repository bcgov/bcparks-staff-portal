import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Season,
  DateRangeAnnual,
  GateDetail,
  SeasonChangeLog,
  DateType,
} from "../models/index.js";
import { saveSeasonData } from "./saveSeasonData.js";
import { getGateDetail } from "./seasonDataHelpers.js";

vi.mock("../models/index.js", () => ({
  Season: { findByPk: vi.fn() },
  DateRange: {},
  DateRangeAnnual: { bulkCreate: vi.fn() },
  GateDetail: { upsert: vi.fn(), findOne: vi.fn() },
  SeasonChangeLog: { create: vi.fn() },
  DateChangeLog: {},
  DateType: { findOne: vi.fn() },
  Dateable: {},
  Feature: {},
  FeatureType: {},
  Park: {},
  User: {},
}));

const oldGateDetail = {
  id: 96,
  publishableId: 84,
  hasGate: true,
  gateOpenTime: "08:00:00",
  gateCloseTime: "20:00:00",
  gateOpensAtDawn: false,
  gateClosesAtDusk: false,
  gateOpen24Hours: false,
};

let params;

/** Set up a season save with no date edits and a persisted gate snapshot. */
beforeEach(() => {
  vi.resetAllMocks();
  const season = {
    id: 1,
    publishableId: 84,
    status: "approved",
    readyToPublish: true,
    save: vi.fn().mockResolvedValue({ id: 1 }),
  };

  params = {
    season,
    dateRanges: [],
    dateRangeAnnuals: [],
    oldGateDetail,
    deletedDateRangeIds: [],
    newStatus: "approved",
    notes: "",
    savedWithErrors: false,
    userId: 2,
    transaction: { id: "transaction" },
  };

  DateType.findOne.mockResolvedValue({ id: 99 });
  DateRangeAnnual.bulkCreate.mockResolvedValue([]);
  GateDetail.upsert.mockResolvedValue([{}, false]);
  GateDetail.findOne.mockResolvedValue(oldGateDetail);
  SeasonChangeLog.create.mockResolvedValue({ id: 3 });
  Season.findByPk.mockResolvedValue(season);
});

describe("saveSeasonData gate snapshots", () => {
  it("reads every gate field before writing and logs complete old and new snapshots", async () => {
    const gateDetail = { hasGate: false, gateOpenTime: null };
    const savedGateDetail = { ...oldGateDetail, ...gateDetail };

    GateDetail.findOne
      .mockResolvedValueOnce(oldGateDetail)
      .mockResolvedValueOnce(savedGateDetail);
    const beforeSave = await getGateDetail(84, params.transaction);

    expect(GateDetail.findOne).toHaveBeenNthCalledWith(1, {
      where: { publishableId: 84 },
      attributes: Object.keys(oldGateDetail),
      transaction: params.transaction,
    });
    await saveSeasonData({ ...params, oldGateDetail: beforeSave, gateDetail });

    expect(GateDetail.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      GateDetail.upsert.mock.invocationCallOrder[0],
    );
    expect(GateDetail.upsert.mock.invocationCallOrder[0]).toBeLessThan(
      GateDetail.findOne.mock.invocationCallOrder[1],
    );
    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: oldGateDetail,
        gateDetailNewValue: savedGateDetail,
      }),
      { transaction: params.transaction },
    );
  });

  it.each([{}, { id: 96, publishableId: 84 }])(
    "logs the complete persisted gate for an incomplete submission: %j",
    async (gateDetail) => {
      await saveSeasonData({ ...params, gateDetail });

      expect(GateDetail.findOne).toHaveBeenCalledWith({
        where: { publishableId: 84 },
        attributes: Object.keys(oldGateDetail),
        transaction: params.transaction,
        raw: true,
      });
      expect(SeasonChangeLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gateDetailOldValue: oldGateDetail,
          gateDetailNewValue: oldGateDetail,
        }),
        { transaction: params.transaction },
      );
      expect(GateDetail.upsert).toHaveBeenCalledWith(
        { ...gateDetail, id: 96, publishableId: 84 },
        { transaction: params.transaction },
      );
      expect(GateDetail.upsert.mock.invocationCallOrder[0]).toBeLessThan(
        GateDetail.findOne.mock.invocationCallOrder[0],
      );
      expect(GateDetail.findOne.mock.invocationCallOrder[0]).toBeLessThan(
        SeasonChangeLog.create.mock.invocationCallOrder[0],
      );
    },
  );

  it("logs the persisted snapshot after an explicit false and null update", async () => {
    const gateDetail = { hasGate: false, gateOpenTime: null };
    const savedGateDetail = { ...oldGateDetail, ...gateDetail };

    GateDetail.findOne.mockResolvedValue(savedGateDetail);
    await saveSeasonData({ ...params, gateDetail });

    expect(GateDetail.upsert).toHaveBeenCalledWith(
      { ...gateDetail, id: 96, publishableId: 84 },
      { transaction: params.transaction },
    );
    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: oldGateDetail,
        gateDetailNewValue: savedGateDetail,
      }),
      { transaction: params.transaction },
    );
  });

  it("includes generated IDs and database defaults for a new gate row", async () => {
    const savedGateDetail = {
      ...oldGateDetail,
      hasGate: null,
      gateOpenTime: null,
      gateCloseTime: null,
    };

    GateDetail.findOne.mockResolvedValue(savedGateDetail);
    await saveSeasonData({ ...params, oldGateDetail: null, gateDetail: {} });

    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: null,
        gateDetailNewValue: savedGateDetail,
      }),
      { transaction: params.transaction },
    );
  });

  it.each([{ gateDetail: null }, {}])(
    "reads the persisted gate without updating it for gate payload %j",
    async (gatePayload) => {
      const persistedGateDetail = { ...oldGateDetail, gateOpen24Hours: true };

      GateDetail.findOne.mockResolvedValue(persistedGateDetail);
      await saveSeasonData({ ...params, ...gatePayload });

      expect(GateDetail.upsert).not.toHaveBeenCalled();
      expect(GateDetail.findOne).toHaveBeenCalledWith({
        where: { publishableId: 84 },
        attributes: Object.keys(oldGateDetail),
        transaction: params.transaction,
        raw: true,
      });
      expect(SeasonChangeLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gateDetailOldValue: oldGateDetail,
          gateDetailNewValue: persistedGateDetail,
        }),
        { transaction: params.transaction },
      );
    },
  );

  it("logs a status-only approval without writing gate details", async () => {
    await saveSeasonData(params);

    expect(GateDetail.upsert).not.toHaveBeenCalled();
    expect(GateDetail.findOne).toHaveBeenCalled();
    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: oldGateDetail,
        gateDetailNewValue: oldGateDetail,
      }),
      { transaction: params.transaction },
    );
  });

  it("logs null when no gate details are submitted or stored", async () => {
    GateDetail.findOne.mockResolvedValue(null);
    await saveSeasonData({ ...params, oldGateDetail: null });

    expect(GateDetail.upsert).not.toHaveBeenCalled();
    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: null,
        gateDetailNewValue: null,
      }),
      { transaction: params.transaction },
    );
  });

  it("does not save or snapshot gate details for winter seasons", async () => {
    await saveSeasonData({
      ...params,
      isWinterSeason: true,
      oldGateDetail: null,
      gateDetail: { hasGate: true, gateOpenTime: "08:00:00" },
    });

    expect(GateDetail.upsert).not.toHaveBeenCalled();
    expect(GateDetail.findOne).not.toHaveBeenCalled();
    expect(SeasonChangeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gateDetailOldValue: null,
        gateDetailNewValue: null,
      }),
      { transaction: params.transaction },
    );
  });
});
