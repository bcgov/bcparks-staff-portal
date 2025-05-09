import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ManagementArea extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Define associations here
      ManagementArea.belongsTo(models.Section, {
        foreignKey: "sectionId",
        as: "section",
      });
    }
  }

  ManagementArea.init(
    {
      managementAreaNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ManagementArea",
    },
  );

  return ManagementArea;
};
