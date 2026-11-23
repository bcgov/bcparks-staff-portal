import { expect, it, vi } from "vitest";
import { syncStrapiData } from "./index.js";
import importStrapiFeatures from "./features/import-features.js";
import deleteStaleWinterFeeDates from "./delete-stale-winter-fee-dates.js";

vi.mock("../../models/index.js", () => ({ Park: {} }));
vi.mock("./sections/import-sections.js", () => ({ default: vi.fn() }));
vi.mock("./management-areas/import-management-areas.js", () => ({
  default: vi.fn(),
}));
vi.mock("./date-types/import-date-types.js", () => ({ default: vi.fn() }));
vi.mock("./parks/import-parks.js", () => ({ default: vi.fn() }));
vi.mock("./park-area-types/import-park-area-types.js", () => ({
  default: vi.fn(),
}));
vi.mock("./park-areas/import-park-areas.js", () => ({ default: vi.fn() }));
vi.mock("./feature-types/import-feature-types.js", () => ({
  default: vi.fn(),
}));
vi.mock("./features/import-features.js", () => ({ default: vi.fn() }));
vi.mock("./delete-stale-winter-fee-dates.js", () => ({ default: vi.fn() }));

it("deletes stale winter fees after importing features in the same transaction", async () => {
  const transaction = {};

  await syncStrapiData(transaction);

  expect(importStrapiFeatures).toHaveBeenCalledWith(transaction);
  expect(deleteStaleWinterFeeDates).toHaveBeenCalledWith(transaction);
  expect(deleteStaleWinterFeeDates.mock.invocationCallOrder[0]).toBeGreaterThan(
    importStrapiFeatures.mock.invocationCallOrder[0],
  );
});
