import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class DateChangeLog extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      DateChangeLog.belongsTo(models.SeasonChangeLog, {
        foreignKey: "seasonChangeLogId",
        as: "seasonChangeLog",
      });
      DateChangeLog.belongsTo(models.DateRange, {
        foreignKey: "dateRangeId",
        as: "dateRange",
      });
    }
  }
  DateChangeLog.init(
    {
      dateRangeId: {
        type: DataTypes.INTEGER,
      },
      seasonChangeLogId: {
        type: DataTypes.INTEGER,
      },
      startDateOldValue: {
        type: DataTypes.DATEONLY,
      },
      startDateNewValue: {
        type: DataTypes.DATEONLY,
      },
      endDateOldValue: {
        type: DataTypes.DATEONLY,
      },
      endDateNewValue: {
        type: DataTypes.DATEONLY,
      },
    },
    {
      sequelize,
      modelName: "DateChangeLog",
    },
  );
  return DateChangeLog;
};
