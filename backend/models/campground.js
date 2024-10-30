import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Campground extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Campground.belongsTo(models.Park, {
        foreignKey: "parkId",
        as: "park",
      });
    }
  }
  Campground.init(
    {
      name: DataTypes.STRING,
      parkId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Campground",
    },
  );
  return Campground;
};
