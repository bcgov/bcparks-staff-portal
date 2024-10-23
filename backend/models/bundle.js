import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Bundle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Bundle.belongsTo(models.ParkOperator, { foreignKey: "parkOperatorId" });
      Bundle.hasMany(models.Park, { foreignKey: "bundleId" });
    }
  }
  Bundle.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      parkOperatorId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Bundle",
    },
  );
  return Bundle;
};
