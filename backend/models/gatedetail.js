import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class GateDetail extends Model {
    static associate(models) {
      GateDetail.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });
    }
  }
  GateDetail.init(
    {
      publishableId: DataTypes.INTEGER,
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
    },
    {
      sequelize,
      modelName: "GateDetail",
    },
  );
  return GateDetail;
};
