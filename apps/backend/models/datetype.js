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
      DateType.hasOne(models.DateRangeAnnual, {
        foreignKey: "dateTypeId",
        as: "dateRangeAnnual",
      });
    }
  }
  DateType.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,

      parkLevel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      featureLevel: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      // Stable ID for lookups and publishing
      // Links to the dateTypeId field in Strapi
      strapiDateTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "DateType",
    },
  );
  return DateType;
};
