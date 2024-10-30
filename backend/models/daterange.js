import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class DateRange extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      DateRange.belongsTo(models.DateType, {
        foreignKey: "dateTypeId",
        as: "dateType",
      });
      DateRange.belongsTo(models.Season, {
        foreignKey: "seasonId",
        as: "season",
      });
      DateRange.belongsTo(models.Dateable, {
        foreignKey: "dateableId",
        as: "dateable",
      });
    }
  }
  DateRange.init(
    {
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      dateTypeId: DataTypes.INTEGER,
      dateableId: DataTypes.INTEGER,
      seasonId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "DateRange",
    },
  );
  return DateRange;
};
