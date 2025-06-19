import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class GateDetail extends Model {
    static associate(models) {
      // one-to-one with Park
      GateDetail.belongsTo(models.Park, {
        foreignKey: "parkId",
        as: "park",
      });

      // one-to-one with ParkArea
      GateDetail.belongsTo(models.ParkArea, {
        foreignKey: "parkAreaId",
        as: "parkArea",
      });

      // one-to-one with Feature
      GateDetail.belongsTo(models.Feature, {
        foreignKey: "featureId",
        as: "feature",
      });
    }
  }
  GateDetail.init(
    {
      parkId: DataTypes.INTEGER,
      parkAreaId: DataTypes.INTEGER,
      featureId: DataTypes.INTEGER,
      hasGate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateOpenTime: DataTypes.TIME,
      gateCloseTime: DataTypes.TIME,
      gateOpensAtDawn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateClosesAtDusk: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateOpen24Hours: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isTimeRangeAnnual: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "GateDetail",
    },
  );
  return GateDetail;
};
