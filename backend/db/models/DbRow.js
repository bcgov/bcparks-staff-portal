import sequelize from "../connection.js";
import { DataTypes } from "sequelize";

export default sequelize.define(
  "DbRow",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "example_table",
    timestamps: false,
  },
);
