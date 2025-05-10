import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Publishable extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Publishable.hasOne(models.Park, { foreignKey: "publishableId" });
      Publishable.hasOne(models.ParkArea, { foreignKey: "publishableId" });
      Publishable.hasOne(models.FeatureType, { foreignKey: "publishableId" });
      Publishable.hasOne(models.Feature, { foreignKey: "publishableId" });

      Publishable.hasMany(models.Season, { foreignKey: "publishableId" });
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
