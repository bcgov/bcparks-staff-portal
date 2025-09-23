import { Model, DataTypes } from "sequelize";

// Each AccessGroupPark association links one AccessGroup (id) to one Park (orcs)

export default (sequelize) => {
  class AccessGroupPark extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Each AccessGroupPark entry belongs to one Park, linked by parkId
      AccessGroupPark.belongsTo(models.Park, {
        foreignKey: "parkId",
        targetKey: "id",
      });

      // Each AccessGroupPark entry belongs to one AccessGroup, linked by accessGroupId
      AccessGroupPark.belongsTo(models.AccessGroup, {
        foreignKey: "accessGroupId",
        targetKey: "id",
      });
    }
  }

  AccessGroupPark.init(
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

      parkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Parks",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "AccessGroupPark",
    },
  );
  return AccessGroupPark;
};
