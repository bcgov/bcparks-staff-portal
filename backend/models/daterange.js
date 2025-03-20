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
      DateRange.hasMany(models.DateChangeLog, {
        foreignKey: "dateRangeId",
        as: "dateChangeLogs",
        onDelete: "CASCADE",
      });
    }
  }
  DateRange.init(
    {
      startDate: DataTypes.DATEONLY,
      endDate: DataTypes.DATEONLY,
      dateTypeId: DataTypes.INTEGER,
      dateableId: DataTypes.INTEGER,
      seasonId: DataTypes.INTEGER,
      adminNote: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: "DateRange",
    },
  );
  return DateRange;
};
