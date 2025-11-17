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
        foreignKey: "userId",
        sourceKey: "id",
        as: "userAccessGroups",
      });

      // Each User can associate with many AccessGroups through UserAccessGroups
      User.belongsToMany(models.AccessGroup, {
        through: models.UserAccessGroup,
        foreignKey: "userId",
        otherKey: "accessGroupId",
        sourceKey: "id",
        as: "accessGroups",
      });
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
