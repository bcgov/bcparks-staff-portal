import sequelize from "../db/connection.js";

import ParkOperatorModel from "./parkOperator.js";
import UserModel from "./user.js";
import BundleModel from "./bundle.js";
import ParkModel from "./park.js";
import CampgroundModel from "./campground.js";
import CampsiteGroupingModel from "./campsitegrouping.js";
import CampsiteModel from "./campsite.js";
import FeatureTypeModel from "./featureType.js";
import SeasonModel from "./season.js";
import ParkFeatureModel from "./parkfeature.js";
import DateTypeModel from "./datetype.js";
import ParkDateModel from "./parkDate.js";
import FeatureDateModel from "./featureDate.js";
import SeasonChangeLogModel from "./seasonChangeLog.js";

const ParkOperator = ParkOperatorModel(sequelize);
const User = UserModel(sequelize);
const Bundle = BundleModel(sequelize);
const Park = ParkModel(sequelize);
const Campground = CampgroundModel(sequelize);
const CampsiteGrouping = CampsiteGroupingModel(sequelize);
const Campsite = CampsiteModel(sequelize);
const FeatureType = FeatureTypeModel(sequelize);
const Season = SeasonModel(sequelize);
const ParkFeature = ParkFeatureModel(sequelize);
const DateType = DateTypeModel(sequelize);
const ParkDate = ParkDateModel(sequelize);
const FeatureDate = FeatureDateModel(sequelize);
const SeasonChangeLog = SeasonChangeLogModel(sequelize);

const models = {
  ParkOperator,
  User,
  Bundle,
  Park,
  Campground,
  CampsiteGrouping,
  Campsite,
  FeatureType,
  Season,
  ParkFeature,
  DateType,
  ParkDate,
  FeatureDate,
  SeasonChangeLog,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  Bundle,
  ParkOperator,
  User,
  Park,
  Campground,
  CampsiteGrouping,
  Campsite,
  FeatureType,
  Season,
  ParkFeature,
  DateType,
  ParkDate,
  FeatureDate,
  SeasonChangeLog,
};
