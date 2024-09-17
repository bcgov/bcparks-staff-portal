import { Sequelize } from "sequelize";

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const db = process.env.POSTGRES_DB;
const port = process.env.POSTGRES_PORT;
const server = process.env.POSTGRES_SERVER;
const connectionString = `postgres://${user}:${password}@${server}:${port}/${db}`;

const sequelize = new Sequelize(connectionString);

export default sequelize;
