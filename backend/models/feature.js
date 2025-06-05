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

      Feature.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });

      Feature.hasMany(models.Season, {
        foreignKey: "publishableId",
        // Features that are part of the ParkArea should be displayed even if the publishableId is null
        // e.g. Shuswap Lake Campground has features site 1-78 and site 79-245
        // sourceKey: "publishableId",
        as: "seasons",
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
      inReservationSystem: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Feature",
    },
  );
  return Feature;
};
