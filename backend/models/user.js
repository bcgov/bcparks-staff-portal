import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.ParkOperator, { foreignKey: "parkOperatorId" });
      User.hasMany(models.SeasonChangeLog, { foreignKey: "userId" });
    }
  }
  User.init(
    {
      idir: { type: DataTypes.STRING, allowNull: false },
      staff: { type: DataTypes.BOOLEAN, defaultValue: false },
      parkOperatorId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
