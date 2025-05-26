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

      // Each User can have many UserAccessGroup associations to assocate with many AccessGroups
      User.hasMany(models.UserAccessGroup, {
        foreignKey: "userEmail",
        sourceKey: "email",
        as: "userAccessGroups",
      });

      // Each User can associate with many AccessGroups through UserAccessGroups
      User.belongsToMany(models.AccessGroup, {
        through: models.UserAccessGroup,
        foreignKey: "userEmail",
        otherKey: "accessGroupId",
        sourceKey: "email",
        as: "accessGroups",
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
