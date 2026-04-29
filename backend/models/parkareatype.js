import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkAreaType extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      ParkAreaType.hasMany(models.ParkArea, {
        foreignKey: "parkAreaTypeId",
        as: "parkAreas",
      });
    }
  }
  ParkAreaType.init(
    {
      name: DataTypes.STRING,
      parkAreaTypeNumber: DataTypes.INTEGER,
      rank: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "ParkAreaType",
    },
  );
  return ParkAreaType;
};
