import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Park extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Park.belongsTo(models.Dateable, {
        foreignKey: "dateableId",
        as: "dateable",
      });

      Park.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });

      Park.hasMany(models.Feature, {
        foreignKey: "parkId",
        as: "features",
      });

      Park.hasMany(models.ParkArea, {
        foreignKey: "parkId",
        as: "parkAreas",
      });

      Park.hasMany(models.Season, {
        foreignKey: "parkId",
        as: "seasons",
      });

      // Each Park can have many AccessGroupParks associations to associate with many AccessGroups
      Park.hasMany(models.AccessGroupPark, {
        foreignKey: "parkOrcs",
        sourceKey: "orcs",
        as: "accessGroupParks",
      });

      // Each Park can associate with many AccessGroups through AccessGroupParks
      Park.belongsToMany(models.AccessGroup, {
        through: models.AccessGroupPark,
        foreignKey: "parkOrcs",
        otherKey: "accessGroupId",
        sourceKey: "orcs",
        as: "accessGroups",
      });
    }
  }
  Park.init(
    {
      name: DataTypes.STRING,
      orcs: DataTypes.STRING,
      dateableId: DataTypes.INTEGER,
      strapiId: DataTypes.INTEGER,
      // store raw json for Management Area and Section names,
      // since they're only needed for display in the CSV export
      managementAreas: DataTypes.JSONB,
      inReservationSystem: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Park",
    },
  );
  return Park;
};
