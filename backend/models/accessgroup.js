import { Model, DataTypes } from "sequelize";

// AccessGroups (formerly "Bundles", and AKA "Operator Agreements") are used to define User access to Parks.
// Each AccessGroup can have many Users and many Parks associated with it
// through the UserAccessGroup and AccessGroupPark models.

export default (sequelize) => {
  class AccessGroup extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each AccessGroup can associate with many Users through UserAccessGroups
      AccessGroup.belongsToMany(models.User, {
        through: models.UserAccessGroup,
        foreignKey: "accessGroupId",
        otherKey: "username",
        targetKey: "username",
        as: "users",
      });

      // Each AccessGroup can associate with many Parks through AccessGroupParks
      AccessGroup.belongsToMany(models.Park, {
        through: models.AccessGroupPark,
        foreignKey: "accessGroupId",
        otherKey: "parkOrcs",
        targetKey: "orcs",
        as: "parks",
      });

      // Each AccessGroup can have many UserAccessGroup associations
      AccessGroup.hasMany(models.UserAccessGroup, {
        foreignKey: "accessGroupId",
        as: "userAccessGroups",
      });
    }
  }

  AccessGroup.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AccessGroup",
    },
  );
  return AccessGroup;
};
