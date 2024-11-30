import { Sequelize } from "sequelize";
import config from "./config.js";

const env = process.env.NODE_ENV || "development";

export const connectionConfig = config[env];

const sequelize = new Sequelize(connectionConfig);

export default sequelize;
