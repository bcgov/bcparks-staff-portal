import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Dateable extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Dateable.hasMany(models.DateRange, {
        foreignKey: "dateableId",
        as: "dateRanges",
      });
      Dateable.hasOne(models.Park, {
        foreignKey: "dateableId",
        as: "park",
      });
      Dateable.hasOne(models.Feature, {
        foreignKey: "dateableId",
        as: "feature",
      });
      Dateable.hasMany(models.DateRangeAnnual, {
        foreignKey: "dateableId",
        as: "dateRangeAnnuals",
      });
    }
  }
  Dateable.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Dateable",
    },
  );
  return Dateable;
};
