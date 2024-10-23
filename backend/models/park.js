import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Park extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Park.belongsTo(models.Bundle, { foreignKey: "bundleId" });
      Park.hasMany(models.Campground, { foreignKey: "parkId" });
      Park.hasMany(models.Season, { foreignKey: "parkId" });
      Park.hasMany(models.ParkFeature, { foreignKey: "parkId" });
      Park.hasMany(models.ParkDate, { foreignKey: "parkId" });
    }
  }
  Park.init(
    {
      orcs: { type: DataTypes.STRING, allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      bundleId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "Park",
    },
  );
  return Park;
};
