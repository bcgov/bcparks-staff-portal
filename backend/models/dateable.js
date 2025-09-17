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
      Dateable.hasMany(models.Park, {
        foreignKey: "dateableId",
        as: "park",
      });
      Dateable.hasMany(models.Feature, {
        foreignKey: "dateableId",
        as: "feature",
      });
      Dateable.hasOne(models.DateRangeAnnual, {
        foreignKey: "dateableId",
        as: "dateRangeAnnual",
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
