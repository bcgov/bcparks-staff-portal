import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class AppSetting extends Model {}

  AppSetting.init(
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: DataTypes.JSONB,
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AppSetting",
    },
  );

  return AppSetting;
};
