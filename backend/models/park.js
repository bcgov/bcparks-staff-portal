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
    },
    {
      sequelize,
      modelName: "Park",
    },
  );
  return Park;
};
