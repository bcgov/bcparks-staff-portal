import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Season extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Season.belongsTo(models.Park, {
        foreignKey: "parkId",
        as: "park",
      });
      Season.belongsTo(models.FeatureType, {
        foreignKey: "featureTypeId",
        as: "featureType",
      });
      Season.hasMany(models.SeasonChangeLog, {
        foreignKey: "seasonId",
        as: "changeLogs",
      });
    }
  }
  Season.init(
    {
      operatingYear: DataTypes.INTEGER,
      parkId: DataTypes.INTEGER,
      featureTypeId: DataTypes.INTEGER,
      status: DataTypes.STRING,
      readyToPublish: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Season",
    },
  );
  return Season;
};
