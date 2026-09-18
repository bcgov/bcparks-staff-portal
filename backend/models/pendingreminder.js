import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class PendingReminder extends Model {}

  PendingReminder.init(
    {
      emailType: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      numericData: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      jsonData: DataTypes.JSONB,
      comparisonDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      notifyManagementArea: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notifyInformationServices: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notifyReservationServices: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      followupAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PendingReminder",
      timestamps: false,
    }
  );

  return PendingReminder;
};
