import { Model, DataTypes } from "sequelize";

// Each UserAccessGroup association links one User (id) to one AccessGroup (id)

export default (sequelize) => {
  class UserAccessGroup extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each UserAccessGroup entry belongs to one User, linked by the user's email
      UserAccessGroup.belongsTo(models.User, {
        foreignKey: "userEmail",
        targetKey: "email",
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

      userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Users",
          key: "email",
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
