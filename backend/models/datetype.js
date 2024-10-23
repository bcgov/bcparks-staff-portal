import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class DateType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      DateType.hasMany(models.ParkDate, { foreignKey: "dateTypeId" });
      DateType.hasMany(models.FeatureDate, { foreignKey: "dateTypeId" });
    }
  }
  DateType.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      startLabel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      endLabel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DateType",
    },
  );
  return DateType;
};
