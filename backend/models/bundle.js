import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Bundle extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each Bundle can associate with many Users through UserBundles
      Bundle.belongsToMany(models.User, {
        through: models.UserBundles,
        foreignKey: "bundleId",
        as: "users",
      });

      // Each Bundle can associate with many Parks through BundleParks
      Bundle.belongsToMany(models.Park, {
        through: models.BundleParks,
        foreignKey: "bundleId",
        as: "parks",
      });

      // Each Bundle can have many UserBundle associations
      Bundle.hasMany(models.UserBundles, {
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
