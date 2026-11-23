import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";
import deleteStaleWinterFeeDates from "./delete-stale-winter-fee-dates.js";
import {
  DateRange,
  DateType,
  Feature,
  Park,
  ParkArea,
  Season,
} from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { getCurrentDateCollectionYear } from "../../utils/operatingYearHelper.js";

vi.mock("../../models/index.js", () => ({
  DateRange: { findAll: vi.fn(), destroy: vi.fn() },
  DateType: { findOne: vi.fn() },
  Feature: { findAll: vi.fn() },
  Park: { findAll: vi.fn() },
  ParkArea: { findAll: vi.fn() },
  Season: {},
}));
vi.mock("../../utils/operatingYearHelper.js", () => ({
  getCurrentDateCollectionYear: vi.fn(),
}));

describe("deleteStaleWinterFeeDates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentDateCollectionYear.mockResolvedValue(2026);
  });

  it("deletes only disabled winter fee ranges in the current winter collection year", async () => {
    const transaction = {};

    DateType.findOne.mockResolvedValue({ id: 4 });
    Park.findAll.mockResolvedValue([{ dateableId: 10 }]);
    ParkArea.findAll.mockResolvedValue([
      { dateableId: 20 },
      { dateableId: null },
    ]);
    Feature.findAll.mockResolvedValue([{ dateableId: 30 }]);
    DateRange.findAll.mockResolvedValue([{ id: 101 }, { id: 102 }]);
    DateRange.destroy.mockResolvedValue(2);

    expect(await deleteStaleWinterFeeDates(transaction)).toBe(2);
    expect(getCurrentDateCollectionYear).toHaveBeenCalledWith(
      SEASON_TYPE.WINTER,
      transaction,
    );
    expect(DateType.findOne).toHaveBeenCalledWith({
      attributes: ["id"],
      where: { dateTypeNumber: DATE_TYPE.WINTER_FEE },
      transaction,
    });
    for (const model of [Park, ParkArea, Feature]) {
      expect(model.findAll).toHaveBeenCalledWith({
        attributes: ["dateableId"],
        where: { hasWinterFeeDates: false },
        transaction,
      });
    }
    expect(DateRange.findAll).toHaveBeenCalledWith({
      attributes: ["id"],
      where: { dateTypeId: 4, dateableId: { [Op.in]: [10, 20, 30] } },
      include: [
        {
          model: Season,
          as: "season",
          attributes: [],
          required: true,
          where: { seasonType: SEASON_TYPE.WINTER, operatingYear: 2026 },
        },
      ],
      transaction,
    });
    expect(DateRange.destroy).toHaveBeenCalledWith({
      where: { id: { [Op.in]: [101, 102] } },
      transaction,
    });
  });

  it("does not delete anything when no disabled record has a dateable", async () => {
    DateType.findOne.mockResolvedValue({ id: 4 });
    Park.findAll.mockResolvedValue([{ dateableId: null }]);
    ParkArea.findAll.mockResolvedValue([]);
    Feature.findAll.mockResolvedValue([]);

    expect(await deleteStaleWinterFeeDates()).toBe(0);
    expect(DateRange.findAll).not.toHaveBeenCalled();
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });

  it("does not delete anything when no matching ranges exist", async () => {
    DateType.findOne.mockResolvedValue({ id: 4 });
    Park.findAll.mockResolvedValue([]);
    ParkArea.findAll.mockResolvedValue([]);
    Feature.findAll.mockResolvedValue([{ dateableId: 30 }]);
    DateRange.findAll.mockResolvedValue([]);

    expect(await deleteStaleWinterFeeDates()).toBe(0);
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });

  it("fails the sync when the winter fee date type is missing", async () => {
    DateType.findOne.mockResolvedValue(null);

    await expect(deleteStaleWinterFeeDates()).rejects.toThrow(
      "Winter fee DateType not found.",
    );
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });
});
