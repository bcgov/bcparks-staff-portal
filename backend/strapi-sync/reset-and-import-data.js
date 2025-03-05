import { syncData, oneTimeDataImport } from "./sync.js";
import { createSingleItemsCampgrounds } from "./create-single-item-campgrounds.js";
import { createMultipleItemsCampgrounds } from "./create-multiple-item-campgrounds.js";
import { createMissingDatesAndSeasons } from "./create-missing-dates-and-seasons.js";
import {
  Dateable,
  Park,
  User,
  Campground,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
  SeasonChangeLog,
  DateChangeLog,
} from "../models/index.js";

export async function deleteAllData() {
  await DateChangeLog.destroy({ where: {} });
  await SeasonChangeLog.destroy({ where: {} });
  await DateRange.destroy({ where: {} });
  await Season.destroy({ where: {} });
  await Feature.destroy({ where: {} });
  await Campground.destroy({ where: {} });
  await FeatureType.destroy({ where: {} });
  await DateType.destroy({ where: {} });
  await Park.destroy({ where: {} });
  await Dateable.destroy({ where: {} });
  await User.destroy({ where: {} });
}

export async function importData() {
  await syncData();
  await oneTimeDataImport();
  await createSingleItemsCampgrounds();
  await createMultipleItemsCampgrounds();
  await createMissingDatesAndSeasons();
}

export async function resetScript() {
  await deleteAllData();

  await importData();
  console.log("calling resetDatabase");
}
