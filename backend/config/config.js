export default {
  development: {
    username: process.env.POSTGRES_USER || "user",
    password: process.env.POSTGRES_PASSWORD || "password",
    database: process.env.POSTGRES_DB || "mydatabase",
    host: process.env.POSTGRES_SERVER || "127.0.0.1",
    port: process.env.POSTGRES_PORT || 5432,
    dialect: "postgres",
  },
  test: {
    username: process.env.POSTGRES_USER || "user",
    password: process.env.POSTGRES_PASSWORD || "password",
    database: process.env.POSTGRES_DB || "mydatabase",
    host: process.env.POSTGRES_SERVER || "127.0.0.1",
    port: process.env.POSTGRES_PORT || 5432,
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL", // Example for production
    dialect: "postgres",
  },
};
