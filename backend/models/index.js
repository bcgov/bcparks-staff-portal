import sequelize from "../db/connection.js";

import DateableModel from "./dateable.js";
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
import SeasonChangeLogModel from "./seasonchangelog.js";
import DateChangeLogModel from "./datechangelog.js";

const Dateable = DateableModel(sequelize);

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

const SeasonChangeLog = SeasonChangeLogModel(sequelize);
const DateChangeLog = DateChangeLogModel(sequelize);

const models = {
  Dateable,
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
  ManagementArea
};
