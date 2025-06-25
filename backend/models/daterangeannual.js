import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class DateRangeAnnual extends Model {
    static associate(models) {
      // one-to-one with date type
      DateRangeAnnual.belongsTo(models.DateType, {
        foreignKey: "dateTypeId",
        as: "dateType",
      });

      // one-to-one with publishable
      DateRangeAnnual.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });
    }
  }

  DateRangeAnnual.init(
    {
      dateTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "DateTypes",
          key: "id",
        },
      },
      publishableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Publishables",
          key: "id",
        },
      },
      isDateRangeAnnual: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "DateRangeAnnual",
    },
  );
  return DateRangeAnnual;
};
