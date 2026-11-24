import { expect, it, vi } from "vitest";
import { syncStrapiData } from "./index.js";
import importStrapiProtectedAreas from "./parks/import-parks.js";
import importStrapiParkAreas from "./park-areas/import-park-areas.js";
import importStrapiFeatures from "./features/import-features.js";

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
it("returns named importer results and disabled Winter fee dateables", async () => {
  const transaction = {};

  importStrapiProtectedAreas.mockResolvedValue({
    dateableIdsWithWinterFeesDisabled: [10],
  });
  importStrapiParkAreas.mockResolvedValue({
    dateableIdsWithWinterFeesDisabled: [20],
  });
  importStrapiFeatures.mockResolvedValue({
    dateableIdsWithWinterFeesDisabled: [30],
  });

  const syncResult = await syncStrapiData(transaction);

  expect(importStrapiFeatures).toHaveBeenCalledWith(transaction);
  expect(syncResult.parks.dateableIdsWithWinterFeesDisabled).toEqual([10]);
  expect(syncResult.parkAreas.dateableIdsWithWinterFeesDisabled).toEqual([20]);
  expect(syncResult.features.dateableIdsWithWinterFeesDisabled).toEqual([30]);
  expect(syncResult.dateableIdsWithWinterFeesDisabled).toEqual([10, 20, 30]);
});
