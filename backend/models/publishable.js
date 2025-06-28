import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Publishable extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Publishable.hasOne(models.Park, {
        foreignKey: "publishableId",
        as: "park",
      });
      Publishable.hasOne(models.ParkArea, {
        foreignKey: "publishableId",
        as: "parkArea",
      });
      Publishable.hasOne(models.FeatureType, {
        foreignKey: "publishableId",
        as: "featureType",
      });
      Publishable.hasOne(models.Feature, {
        foreignKey: "publishableId",
        as: "feature",
      });

      Publishable.hasMany(models.Season, {
        foreignKey: "publishableId",
        as: "seasons",
      });

      Publishable.hasOne(models.GateDetail, {
        foreignKey: "publishableId",
        as: "gateDetail",
      });

      Publishable.hasMany(models.DateRangeAnnual, {
        foreignKey: "publishableId",
        as: "dateRangeAnnual",
      });
    }
  }
  Publishable.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Publishable",
    },
  );
  return Publishable;
};
