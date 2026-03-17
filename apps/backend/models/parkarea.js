import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class ParkArea extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      ParkArea.belongsTo(models.Park, {
        foreignKey: "parkId",
        as: "park",
      });

      ParkArea.belongsTo(models.Dateable, {
        foreignKey: "dateableId",
        as: "dateable",
      });

      ParkArea.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });

      ParkArea.hasMany(models.Feature, {
        foreignKey: "parkAreaId",
        as: "features",
      });

      ParkArea.hasMany(models.Season, {
        foreignKey: "publishableId",
        sourceKey: "publishableId",
        as: "seasons",
      });

      // A park area has an associated GateDetail record
      ParkArea.hasOne(models.GateDetail, {
        foreignKey: "publishableId",
        sourceKey: "publishableId",
        as: "gateDetails",
      });
    }
  }
  ParkArea.init(
    {
      name: DataTypes.STRING,
      parkId: DataTypes.INTEGER,
      dateableId: DataTypes.INTEGER,
      active: DataTypes.BOOLEAN,

      inReservationSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      strapiOrcsAreaNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "ParkArea",
    },
  );
  return ParkArea;
};
