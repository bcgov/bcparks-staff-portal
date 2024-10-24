import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Campsite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     * @param models
     */
    static associate(models) {
      // define association here
      Campsite.belongsTo(models.CampsiteGrouping, {
        foreignKey: "campsiteGroupingId",
      });
    }
  }
  Campsite.init(
    {
      name: { type: DataTypes.STRING, allowNull: true },
      campsiteNumber: { type: DataTypes.INTEGER, allowNull: true },
      campsiteGroupingId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Campsite",
    },
  );
  return Campsite;
};
