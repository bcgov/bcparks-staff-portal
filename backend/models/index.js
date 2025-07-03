import sequelize from "../db/connection.js";

import DateableModel from "./dateable.js";
import PublishableModel from "./publishable.js";
import ParkModel from "./park.js";
import UserModel from "./user.js";
import ParkAreaModel from "./parkarea.js";
import FeatureTypeModel from "./featuretype.js";
import FeatureModel from "./feature.js";
import DateTypeModel from "./datetype.js";
import SeasonModel from "./season.js";
import DateRangeModel from "./daterange.js";
import SectionModel from "./section.js";
import ManagementAreaModel from "./managementarea.js";
import DateRangeAnnualModel from "./daterangeannual.js";
import GateDetailModel from "./gatedetail.js";
import AccessGroupModel from "./accessgroup.js";
import UserAccessGroupModel from "./useraccessgroup.js";
import AccessGroupParkModel from "./accessgrouppark.js";
import SeasonChangeLogModel from "./seasonchangelog.js";
import DateChangeLogModel from "./datechangelog.js";

// Junction tables with ID columns
const Dateable = DateableModel(sequelize);
const Publishable = PublishableModel(sequelize);

const Park = ParkModel(sequelize);

const User = UserModel(sequelize);

const ParkArea = ParkAreaModel(sequelize);
const FeatureType = FeatureTypeModel(sequelize);
const Feature = FeatureModel(sequelize);
const DateType = DateTypeModel(sequelize);
const Season = SeasonModel(sequelize);
const DateRange = DateRangeModel(sequelize);
const Section = SectionModel(sequelize);
const ManagementArea = ManagementAreaModel(sequelize);
const DateRangeAnnual = DateRangeAnnualModel(sequelize);
const GateDetail = GateDetailModel(sequelize);
const AccessGroup = AccessGroupModel(sequelize);
const UserAccessGroup = UserAccessGroupModel(sequelize);
const AccessGroupPark = AccessGroupParkModel(sequelize);

const SeasonChangeLog = SeasonChangeLogModel(sequelize);
const DateChangeLog = DateChangeLogModel(sequelize);

const models = {
  Dateable,
  Publishable,
  Park,
  User,
  ParkArea,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
  Section,
  ManagementArea,
  DateRangeAnnual,
  GateDetail,
  AccessGroup,
  UserAccessGroup,
  AccessGroupPark,
  SeasonChangeLog,
  DateChangeLog,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  Dateable,
  Publishable,
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
  DateRangeAnnual,
  GateDetail,
  AccessGroup,
  UserAccessGroup,
  AccessGroupPark,
};
