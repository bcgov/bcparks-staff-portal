import { Sequelize } from "sequelize";
import config from "./config.js";

const env = process.env.NODE_ENV || "development";
const connectionConfig = config[env];
const { username, password, database, host, port } = connectionConfig;

export const connectionString = `postgres://${username}:${password}@${host}:${port}/${database}`;

const sequelize = new Sequelize(connectionString);

export default sequelize;
