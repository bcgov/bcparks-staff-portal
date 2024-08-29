import { Sequelize } from "sequelize";

const sequelize = new Sequelize(process.env.PG_CONNECTION_STRING);

export default sequelize;
