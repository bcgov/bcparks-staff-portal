import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class FeatureType extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      FeatureType.hasMany(models.Feature, {
        foreignKey: "featureTypeId",
        as: "features",
      });
    }
  }
  FeatureType.init(
    {
      name: DataTypes.STRING,
      strapiFeatureTypeId: DataTypes.INTEGER,
      icon: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "FeatureType",
    },
  );
  return FeatureType;
};
