import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Section extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // Define associations here
      Section.hasMany(models.ManagementArea, {
        foreignKey: "sectionId",
        as: "managementAreas",
      });
    }
  }

  Section.init(
    {
      sectionNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sectionName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Section",
    },
  );

  return Section;
};
