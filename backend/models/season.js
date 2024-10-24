import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Season extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Season.belongsTo(models.FeatureType, { foreignKey: "featureTypeId" });
      Season.hasMany(models.ParkDate, { foreignKey: "seasonId" });
      Season.belongsTo(models.Park, { foreignKey: "parkId" });
      Season.hasMany(models.SeasonChangeLog, { foreignKey: "seasonId" });
    }
  }
  Season.init(
    {
      year: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      orcs: { type: DataTypes.STRING, allowNull: false },
      parkId: { type: DataTypes.INTEGER, allowNull: false },
      featureTypeId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Season",
    },
  );
  return Season;
};
