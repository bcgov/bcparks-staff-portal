import "../env.js";

import {
  Dateable,
  DateRange,
  DateType,
  Feature,
  FeatureType,
  Park,
  ParkArea,
  Publishable,
  Season,
  GateDetail,
  Section,
  ManagementArea,
  DateChangeLog,
  SeasonChangeLog,
  DateRangeAnnual,
  UserAccessGroup,
  AccessGroupPark,
  AccessGroup,
} from "../models/index.js";

// Deletes everything except Users from the DB
export async function deleteAllData() {
  await DateRangeAnnual.destroy({ where: {} });
  await ManagementArea.destroy({ where: {} });
  await GateDetail.destroy({ where: {} });
  await Section.destroy({ where: {} });
  await DateChangeLog.destroy({ where: {} });
  await SeasonChangeLog.destroy({ where: {} });
  await DateRange.destroy({ where: {} });
  await Season.destroy({ where: {} });
  await Feature.destroy({ where: {} });
  await ParkArea.destroy({ where: {} });
  await FeatureType.destroy({ where: {} });
  await DateType.destroy({ where: {} });
  await UserAccessGroup.destroy({ where: {} });
  await AccessGroupPark.destroy({ where: {} });
  await AccessGroup.destroy({ where: {} });
  await Park.destroy({ where: {} });
  await Dateable.destroy({ where: {} });
  await Publishable.destroy({ where: {} });
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  deleteAllData().catch((err) => {
    console.error("Unhandled error in deleteAllData:", err);
    throw err;
  });
}
