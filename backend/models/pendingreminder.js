import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class PendingReminder extends Model {}

  PendingReminder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      emailType: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: "PendingReminders_emailType_numericData_unique",
      },
      numericData: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: "PendingReminders_emailType_numericData_unique",
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
      followUpDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PendingReminder",
      timestamps: false,
    },
  );

  return PendingReminder;
};
