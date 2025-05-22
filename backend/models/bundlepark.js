import { Model } from "sequelize";

// Each BundlePark association links one Bundle (id) to one Park (orcs)

export default (sequelize, DataTypes) => {
  class BundlePark extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each BundlePark entry belongs to one Park, linked by parkOrcs
      BundlePark.belongsTo(models.Park, {
        foreignKey: "parkOrcs",
        targetKey: "orcs",
      });

      // Each BundlePark entry belongs to one Bundle, linked by bundleId
      BundlePark.belongsTo(models.Bundle, {
        foreignKey: "bundleId",
        targetKey: "id",
      });
    }
  }

  BundlePark.init(
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

      parkOrcs: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Parks",
          key: "orcs",
        },
      },
    },
    {
      sequelize,
      modelName: "BundlePark",
    },
  );
  return BundlePark;
};
