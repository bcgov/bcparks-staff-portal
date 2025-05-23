import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Bundle extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each Bundle can associate with many Users through UserBundles
      Bundle.belongsToMany(models.User, {
        through: models.UserBundle,
        foreignKey: "bundleId",
        otherKey: "userEmail",
        targetKey: "email",
        as: "users",
      });

      // Each Bundle can associate with many Parks through BundleParks
      Bundle.belongsToMany(models.Park, {
        through: models.BundlePark,
        foreignKey: "bundleId",
        otherKey: "parkOrcs",
        targetKey: "orcs",
        as: "parks",
      });

      // Each Bundle can have many UserBundle associations
      Bundle.hasMany(models.UserBundle, {
        foreignKey: "bundleId",
        as: "userBundles",
      });
    }
  }

  Bundle.init(
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
      modelName: "Bundle",
    },
  );
  return Bundle;
};
