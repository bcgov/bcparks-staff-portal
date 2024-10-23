import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkFeature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      ParkFeature.belongsTo(models.Park, { foreignKey: "parkId" });
      ParkFeature.belongsTo(models.FeatureType, {
        foreignKey: "featureTypeId",
      });
      ParkFeature.belongsTo(models.CampsiteGrouping, {
        foreignKey: "campsiteGroupingId",
      });
      ParkFeature.hasMany(models.FeatureDate, { foreignKey: "parkFeatureId" });
      ParkFeature.belongsTo(models.Bundle, { foreignKey: "bundleId" });
    }
  }
  ParkFeature.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      hasReservations: { type: DataTypes.BOOLEAN, defaultValue: false },
      orcs: { type: DataTypes.STRING, allowNull: false },
      parkId: { type: DataTypes.INTEGER, allowNull: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      featureTypeId: { type: DataTypes.INTEGER, allowNull: false },
      campsiteGroupingId: { type: DataTypes.INTEGER, allowNull: true },
      bundleId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "ParkFeature",
    },
  );
  return ParkFeature;
};
