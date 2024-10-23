import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class SeasonChangeLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      SeasonChangeLog.belongsTo(models.Season, { foreignKey: "seasonId" });
      SeasonChangeLog.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  SeasonChangeLog.init(
    {
      timestamp: { type: DataTypes.DATE, allowNull: false },
      notes: { type: DataTypes.STRING, allowNull: true },
      statusOldValue: { type: DataTypes.STRING, allowNull: true },
      statusNewValue: { type: DataTypes.STRING, allowNull: true },
      seasonId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "SeasonChangeLog",
    },
  );
  return SeasonChangeLog;
};
