import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkOperator extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      ParkOperator.hasMany(models.User, { foreignKey: "parkOperatorId" });
      ParkOperator.hasMany(models.Bundle, { foreignKey: "parkOperatorId" });
    }
  }
  ParkOperator.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ParkOperator",
    },
  );
  return ParkOperator;
};
