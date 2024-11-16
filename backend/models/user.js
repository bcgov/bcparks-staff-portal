import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class User extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      User.hasMany(models.SeasonChangeLog, {
        foreignKey: "userId",
        as: "changeLogs",
      });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      staff: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
