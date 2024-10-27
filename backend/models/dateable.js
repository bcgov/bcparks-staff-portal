import { Model } from "sequelize";

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
    }
  }
  Dateable.init(
    {},
    {
      sequelize,
      modelName: "Dateable",
    },
  );
  return Dateable;
};
