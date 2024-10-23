import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Campground extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Campground.belongsTo(models.Park, { foreignKey: "parkId" });
      Campground.hasMany(models.CampsiteGrouping, {
        foreignKey: "campgroundId",
      });
    }
  }
  Campground.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      orcs: { type: DataTypes.STRING, allowNull: false },
      parkId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Campground",
    },
  );
  return Campground;
};
