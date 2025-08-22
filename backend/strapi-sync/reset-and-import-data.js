import { syncData, oneTimeDataImport } from "./sync.js";
import { createSingleItemsCampgrounds } from "./create-single-item-campgrounds.js";
import { createMultipleItemsCampgrounds } from "./create-multiple-item-campgrounds.js";
import { createMissingDatesAndSeasons } from "./create-missing-dates-and-seasons.js";
import {
  Dateable,
  Park,
  User,
  ParkArea,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
  SeasonChangeLog,
  DateChangeLog,
  Section,
  ManagementArea,
  GateDetail,
} from "../models/index.js";

export async function deleteAllData() {
  await GateDetail.destroy({ where: {} });
  await Section.destroy({ where: {} });
  await ManagementArea.destroy({ where: {} });
  await DateChangeLog.destroy({ where: {} });
  await SeasonChangeLog.destroy({ where: {} });
  await DateRange.destroy({ where: {} });
  await Season.destroy({ where: {} });
  await Feature.destroy({ where: {} });
  await ParkArea.destroy({ where: {} });
  await FeatureType.destroy({ where: {} });
  await DateType.destroy({ where: {} });
  await Park.destroy({ where: {} });
  await Dateable.destroy({ where: {} });
  await User.destroy({ where: {} });
}

// TODO: clean up this function
export async function importData() {
  await syncData();
  // await oneTimeDataImport();
  await createSingleItemsCampgrounds();
  await createMultipleItemsCampgrounds();
  // await createMissingDatesAndSeasons();
}

export async function resetScript() {
  await deleteAllData();

  await importData();
  console.log("calling resetDatabase");
}
