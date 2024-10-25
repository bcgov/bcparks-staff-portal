import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkBundle extends Model {
    // eslint-disable-next-line no-unused-vars -- doesn't need its own associations
    static associate(models) {}
  }

  ParkBundle.init(
    {
      parkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Parks",
          key: "id",
        },
      },
      bundleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Bundles",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "ParkBundle",
      tableName: "ParkBundles",
      indexes: [
        {
          unique: true,
          fields: ["parkId", "bundleId"],
        },
      ],
    },
  );
  return ParkBundle;
};
