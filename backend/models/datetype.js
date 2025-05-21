import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class DateType extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      DateType.hasMany(models.DateRange, {
        foreignKey: "dateTypeId",
        as: "dateRanges",
      });
    }
  }
  DateType.init(
    {
      name: DataTypes.STRING,
      startDateLabel: DataTypes.STRING,
      endDateLabel: DataTypes.STRING,
      description: DataTypes.TEXT,
      level: {
        type: DataTypes.ENUM("park", "feature"),
        allowNull: false,
        defaultValue: "feature",
      },
    },
    {
      sequelize,
      modelName: "DateType",
    },
  );
  return DateType;
};
