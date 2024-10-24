import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class FeatureType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      FeatureType.hasMany(models.Season, { foreignKey: "featureTypeId" });
      FeatureType.hasMany(models.ParkFeature, { foreignKey: "featureTypeId" });
    }
  }
  FeatureType.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      hasCampsites: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "FeatureType",
    },
  );
  return FeatureType;
};
