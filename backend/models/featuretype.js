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

      FeatureType.belongsTo(models.Dateable, {
        foreignKey: "dateableId",
        as: "dateable",
      });

      FeatureType.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });
    }
  }
  FeatureType.init(
    {
      name: DataTypes.STRING,
      strapiId: DataTypes.INTEGER,
      icon: DataTypes.STRING,
      dateableId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "FeatureType",
    },
  );
  return FeatureType;
};
