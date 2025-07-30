import { Model, DataTypes } from "sequelize";

// Each UserAccessGroup association links one User (username) to one AccessGroup (id)

export default (sequelize) => {
  class UserAccessGroup extends Model {
    static associate(models) {
      // Each UserAccessGroup entry belongs to one User, linked by the user's username
      UserAccessGroup.belongsTo(models.User, {
        foreignKey: "username",
        targetKey: "username",
        as: "user",
      });

      // Each UserAccessGroup entry belongs to one AccessGroup, linked by accessGroupId
      UserAccessGroup.belongsTo(models.AccessGroup, {
        foreignKey: "accessGroupId",
        targetKey: "id",
        as: "accessGroup",
      });
    }
  }

  UserAccessGroup.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      accessGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "AccessGroups",
          key: "id",
        },
      },

      username: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Users",
          key: "username",
        },
      },
    },
    {
      sequelize,
      modelName: "UserAccessGroup",
    },
  );
  return UserAccessGroup;
};
