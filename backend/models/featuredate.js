import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class FeatureDate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      FeatureDate.belongsTo(models.ParkFeature, {
        foreignKey: "parkFeatureId",
      });
      FeatureDate.belongsTo(models.DateType, { foreignKey: "dateTypeId" });
    }
  }
  FeatureDate.init(
    {
      operatingYear: { type: DataTypes.INTEGER, allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      isDateRangeAnnual: { type: DataTypes.BOOLEAN, defaultValue: false },
      parkFeatureId: { type: DataTypes.INTEGER, allowNull: false },
      dateTypeId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "FeatureDate",
    },
  );
  return FeatureDate;
};
