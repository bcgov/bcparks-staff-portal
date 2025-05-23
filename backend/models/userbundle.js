import { Model, DataTypes } from "sequelize";

// Each UserBundle association links one User (id) to one Bundle (id)

export default (sequelize) => {
  class UserBundle extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each UserBundle entry belongs to one User, linked by the user's email
      UserBundle.belongsTo(models.User, {
        foreignKey: "userEmail",
        targetKey: "email",
        as: "user",
      });

      // Each UserBundle entry belongs to one Bundle, linked by bundleId
      UserBundle.belongsTo(models.Bundle, {
        foreignKey: "bundleId",
        targetKey: "id",
        as: "bundle",
      });
    }
  }

  UserBundle.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      bundleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Bundles",
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
      modelName: "UserBundle",
    },
  );
  return UserBundle;
};
