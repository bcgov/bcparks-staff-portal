import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class SeasonChangeLog extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      SeasonChangeLog.belongsTo(models.Season, {
        foreignKey: "seasonId",
        as: "season",
      });
      SeasonChangeLog.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
      SeasonChangeLog.hasMany(models.DateChangeLog, {
        foreignKey: "seasonChangeLogId",
        as: "seasonChangeLogs",
      });
    }
  }
  SeasonChangeLog.init(
    {
      seasonId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      notes: DataTypes.TEXT,
      statusOldValue: DataTypes.STRING,
      statusNewValue: DataTypes.STRING,
      readyToPublishOldValue: DataTypes.BOOLEAN,
      readyToPublishNewValue: DataTypes.BOOLEAN,
      gateDetailOldValue: DataTypes.JSONB,
      gateDetailNewValue: DataTypes.JSONB,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "SeasonChangeLog",
    },
  );
  return SeasonChangeLog;
};
