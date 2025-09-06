import { Model, DataTypes } from "sequelize";

export default (sequelize) => {
  class Season extends Model {
    // Helper method for defining associations.
    // This method is not a part of Sequelize lifecycle.
    // The `models/index` file will call this method automatically.
    // @param models
    static associate(models) {
      // define association here
      Season.belongsTo(models.Park, {
        foreignKey: "publishableId",
        targetKey: "publishableId",
        as: "park",
      });

      Season.belongsTo(models.ParkArea, {
        foreignKey: "publishableId",
        targetKey: "publishableId",
        as: "parkArea",
      });

      Season.belongsTo(models.Feature, {
        foreignKey: "publishableId",
        targetKey: "publishableId",
        as: "feature",
      });

      Season.belongsTo(models.Publishable, {
        foreignKey: "publishableId",
        as: "publishable",
      });

      Season.hasOne(models.GateDetail, {
        foreignKey: "publishableId",
        sourceKey: "publishableId",
        as: "gateDetail",
      });

      Season.hasMany(models.SeasonChangeLog, {
        foreignKey: "seasonId",
        as: "changeLogs",
      });

      Season.hasMany(models.DateRange, {
        foreignKey: "seasonId",
        as: "dateRanges",
      });
    }
  }

  Season.init(
    {
      operatingYear: DataTypes.INTEGER,
      publishableId: DataTypes.INTEGER,
      status: DataTypes.STRING,
      readyToPublish: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      editable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      seasonType: {
        type: DataTypes.ENUM("winter", "regular"),
        allowNull: false,
        defaultValue: "regular",
      },
      createdAt: DataTypes.DATE,
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Season",
      timestamps: false,
      hooks: {
        beforeCreate(season) {
          season.updatedAt = null;
          season.createdAt = new Date();
        },
        beforeBulkUpdate(seasons) {
          // set updatedAt to current date
          // updatedAt timeStamp will only be updated with bulkUpdate
          // we need to use individual save() for when we want to set it to null
          seasons.fields.push("updatedAt");
          seasons.attributes.updatedAt = new Date();
        },
      },
    },
  );
  return Season;
};
