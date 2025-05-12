import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Feature extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Feature.belongsTo(models.Park, {
        foreignKey: "parkId",
        as: "park",
      });
      Feature.belongsTo(models.FeatureType, {
        foreignKey: "featureTypeId",
        as: "featureType",
      });
      Feature.belongsTo(models.ParkArea, {
        foreignKey: "parkAreaId",
        as: "parkArea",
      });
      Feature.belongsTo(models.Dateable, {
        foreignKey: "dateableId",
        as: "dateable",
      });
    }
  }
  Feature.init(
    {
      name: DataTypes.STRING,
      parkId: DataTypes.INTEGER,
      strapiFeatureId: DataTypes.STRING,
      featureTypeId: DataTypes.INTEGER,
      dateableId: DataTypes.INTEGER,
      hasReservations: DataTypes.BOOLEAN,
      parkAreaId: DataTypes.INTEGER,
      active: DataTypes.BOOLEAN,
      strapiId: DataTypes.INTEGER,
      hasWinterFeeDates: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Feature",
    },
  );
  return Feature;
};
