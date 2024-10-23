import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class CampsiteGrouping extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      CampsiteGrouping.belongsTo(models.Campground, {
        foreignKey: "campgroundId",
      });
      CampsiteGrouping.hasMany(models.Campsite, {
        foreignKey: "campsiteGroupingId",
      });
      CampsiteGrouping.hasMany(models.ParkFeature, {
        foreignKey: "campsiteGroupingId",
      });
    }
  }
  CampsiteGrouping.init(
    {
      siteRangeDescription: { type: DataTypes.STRING, allowNull: false },
      campgroundId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "CampsiteGrouping",
    },
  );
  return CampsiteGrouping;
};
