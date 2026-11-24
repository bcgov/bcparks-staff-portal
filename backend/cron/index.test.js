import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTransactionWithRetry: vi.fn(),
  getCurrentDateCollectionYear: vi.fn(),
  syncStrapiData: vi.fn(),
  createSeasons: vi.fn(),
  createWinterSeasons: vi.fn(),
  deleteStaleWinterFeeDates: vi.fn(),
  propagateWinterFeeDates: vi.fn(),
  createGateDetails: vi.fn(),
  queueEmailReminders: vi.fn(),
}));

vi.mock("../db/transaction.js", () => ({
  createTransactionWithRetry: mocks.createTransactionWithRetry,
}));
vi.mock("../utils/operatingYearHelper.js", () => ({
  getCurrentDateCollectionYear: mocks.getCurrentDateCollectionYear,
}));
vi.mock("../tasks/import-strapi-data/index.js", () => ({
  syncStrapiData: mocks.syncStrapiData,
}));
vi.mock("../tasks/create-seasons/create-seasons.js", () => ({
  default: mocks.createSeasons,
}));
vi.mock("../tasks/create-winter-seasons/create-winter-seasons.js", () => ({
  default: mocks.createWinterSeasons,
}));
vi.mock("../tasks/import-strapi-data/delete-stale-winter-fee-dates.js", () => ({
  default: mocks.deleteStaleWinterFeeDates,
}));
vi.mock("../utils/propagateWinterFeeDates.js", () => ({
  default: mocks.propagateWinterFeeDates,
}));
vi.mock("../tasks/create-gate-details/create-gate-details.js", () => ({
  default: mocks.createGateDetails,
}));
vi.mock("../tasks/queue-email-reminders/queue-email-reminders.js", () => ({
  queueEmailReminders: mocks.queueEmailReminders,
}));

import { runAllJobs } from "./index.js";

describe("runAllJobs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("removes disabled Winter fee ranges recreated during season population", async () => {
    const transaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      finished: false,
    };
    const disabledDateableId = 42;
    let winterFeeRangeExists = false;

    mocks.createTransactionWithRetry.mockResolvedValue(transaction);
    mocks.getCurrentDateCollectionYear.mockResolvedValue(2027);
    mocks.syncStrapiData.mockResolvedValue({
      dateableIdsWithWinterFeesDisabled: [disabledDateableId],
    });
    mocks.createSeasons.mockImplementation(async () => {
      winterFeeRangeExists = true;
    });
    mocks.createWinterSeasons.mockResolvedValue({});
    mocks.deleteStaleWinterFeeDates.mockImplementation(async (dateableIds) => {
      if (dateableIds.includes(disabledDateableId)) {
        winterFeeRangeExists = false;
      }
      return { deletedCount: 1, affectedSeasonIds: [501] };
    });
    mocks.propagateWinterFeeDates.mockResolvedValue({});
    mocks.createGateDetails.mockResolvedValue();
    mocks.queueEmailReminders.mockResolvedValue({ failedCount: 0 });

    await runAllJobs();

    expect(mocks.deleteStaleWinterFeeDates).toHaveBeenCalledWith(
      [disabledDateableId],
      transaction,
    );
    expect(
      mocks.deleteStaleWinterFeeDates.mock.invocationCallOrder[0],
    ).toBeGreaterThan(mocks.createSeasons.mock.invocationCallOrder.at(-1));
    expect(
      mocks.deleteStaleWinterFeeDates.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      mocks.createWinterSeasons.mock.invocationCallOrder.at(-1),
    );
    expect(mocks.propagateWinterFeeDates).toHaveBeenCalledWith(
      501,
      transaction,
    );
    expect(
      mocks.propagateWinterFeeDates.mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      mocks.deleteStaleWinterFeeDates.mock.invocationCallOrder[0],
    );
    expect(winterFeeRangeExists).toBe(false);
  });
});
