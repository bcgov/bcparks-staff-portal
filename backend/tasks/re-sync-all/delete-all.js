import "../../env.js";

import {
  AccessGroup,
  AccessGroupPark,
  DateChangeLog,
  DateRange,
  DateRangeAnnual,
  DateType,
  Dateable,
  Feature,
  FeatureType,
  GateDetail,
  ManagementArea,
  Park,
  ParkArea,
  Publishable,
  Season,
  SeasonChangeLog,
  Section,
  UserAccessGroup,
} from "../../models/index.js";

// delete all data but not User table
export async function deleteAllData() {
  await AccessGroup.destroy({ where: {} });
  await AccessGroupPark.destroy({ where: {} });
  await DateChangeLog.destroy({ where: {} });
  await DateRange.destroy({ where: {} });
  await DateRangeAnnual.destroy({ where: {} });
  await DateType.destroy({ where: {} });
  await Dateable.destroy({ where: {} });
  await Feature.destroy({ where: {} });
  await FeatureType.destroy({ where: {} });
  await GateDetail.destroy({ where: {} });
  await ManagementArea.destroy({ where: {} });
  await Park.destroy({ where: {} });
  await ParkArea.destroy({ where: {} });
  await Publishable.destroy({ where: {} });
  await Season.destroy({ where: {} });
  await SeasonChangeLog.destroy({ where: {} });
  await Section.destroy({ where: {} });
  await UserAccessGroup.destroy({ where: {} });
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  deleteAllData().catch((err) => {
    console.error("Unhandled error in deleteAllData:", err);
    throw err;
  });
}
