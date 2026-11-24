import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";
import deleteStaleWinterFeeDates from "./delete-stale-winter-fee-dates.js";
import { DateRange, DateType, Season } from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { getCurrentDateCollectionYear } from "../../utils/operatingYearHelper.js";

vi.mock("../../models/index.js", () => ({
  DateRange: { findAll: vi.fn(), destroy: vi.fn() },
  DateType: { findOne: vi.fn() },
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

  it("deletes only imported stale dateables in the current winter collection year", async () => {
    const transaction = {};

    DateType.findOne.mockResolvedValue({ id: 4 });
    DateRange.findAll.mockResolvedValue([{ id: 101 }, { id: 102 }]);
    DateRange.destroy.mockResolvedValue(2);

    expect(
      await deleteStaleWinterFeeDates([10, 20, 10, null], transaction),
    ).toBe(2);
    expect(getCurrentDateCollectionYear).toHaveBeenCalledWith(
      SEASON_TYPE.WINTER,
      transaction,
    );
    expect(DateType.findOne).toHaveBeenCalledWith({
      attributes: ["id"],
      where: { dateTypeNumber: DATE_TYPE.WINTER_FEE },
      transaction,
    });
    expect(DateRange.findAll).toHaveBeenCalledWith({
      attributes: ["id"],
      where: { dateTypeId: 4, dateableId: { [Op.in]: [10, 20] } },
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

  it("does not delete anything when the import reports no stale dateables", async () => {
    expect(await deleteStaleWinterFeeDates([], {})).toBe(0);
    expect(DateType.findOne).not.toHaveBeenCalled();
    expect(DateRange.findAll).not.toHaveBeenCalled();
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });

  it("does not delete anything when no matching ranges exist", async () => {
    DateType.findOne.mockResolvedValue({ id: 4 });
    DateRange.findAll.mockResolvedValue([]);

    expect(await deleteStaleWinterFeeDates([30])).toBe(0);
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });

  it("fails the sync when the winter fee date type is missing", async () => {
    DateType.findOne.mockResolvedValue(null);

    await expect(deleteStaleWinterFeeDates([30])).rejects.toThrow(
      "Winter fee DateType not found.",
    );
    expect(DateRange.destroy).not.toHaveBeenCalled();
  });
});
