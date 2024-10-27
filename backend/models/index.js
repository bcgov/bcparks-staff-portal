import sequelize from "../db/connection.js";

import DateableModel from "./dateable.js";
import ParkModel from "./park.js";
import UserModel from "./user.js";
import CampgroundModel from "./campground.js";
import FeatureTypeModel from "./featuretype.js";
import FeatureModel from "./feature.js";
import DateTypeModel from "./datetype.js";
import SeasonModel from "./season.js";
import DateRangeModel from "./daterange.js";

const Dateable = DateableModel(sequelize);
const Park = ParkModel(sequelize);
const User = UserModel(sequelize);
const Campground = CampgroundModel(sequelize);
const FeatureType = FeatureTypeModel(sequelize);
const Feature = FeatureModel(sequelize);
const DateType = DateTypeModel(sequelize);
const Season = SeasonModel(sequelize);
const DateRange = DateRangeModel(sequelize);

const models = {
  Dateable,
  Park,
  User,
  Campground,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
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
  Campground,
  FeatureType,
  Feature,
  DateType,
  Season,
  DateRange,
};
