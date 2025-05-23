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

      // Each User can have many UserBundle associations to assocate with many Bundles
      User.hasMany(models.UserBundle, {
        foreignKey: "userEmail",
        sourceKey: "email",
        as: "userBundles",
      });

      // Each User can associate with many Bundles through UserBundles
      User.belongsToMany(models.Bundle, {
        through: models.UserBundle,
        foreignKey: "userEmail",
        otherKey: "bundleId",
        as: "bundles",
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
