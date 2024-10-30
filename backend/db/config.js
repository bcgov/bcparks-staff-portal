// use the same environment variable names for all environments
const connectionConfig = {
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_SERVER,
  port: process.env.POSTGRES_PORT || 5432,
  dialect: "postgres",
};

export default {
  development: connectionConfig,
  test: connectionConfig,
  production: connectionConfig,
};
