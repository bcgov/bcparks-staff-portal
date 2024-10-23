import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkDate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      ParkDate.belongsTo(models.Park, { foreignKey: "parkId" });
      ParkDate.belongsTo(models.DateType, { foreignKey: "dateTypeId" });
      ParkDate.belongsTo(models.Season, { foreignKey: "seasonId" });
    }
  }
  ParkDate.init(
    {
      orcs: { type: DataTypes.STRING, allowNull: false },
      parkId: { type: DataTypes.INTEGER, allowNull: false },
      operatingYear: { type: DataTypes.INTEGER, allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      isDateRangeAnnual: { type: DataTypes.BOOLEAN, defaultValue: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      dateTypeId: { type: DataTypes.INTEGER, allowNull: false },
      seasonId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "ParkDate",
    },
  );
  return ParkDate;
};
