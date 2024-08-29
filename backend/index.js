import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import autoLoad from "@fastify/autoload";
import fastify from "fastify";

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("Required environment variables are not set");
}

const app = fastify({
  logger: true,
});

// auto-load routes defined in the `routes/` directory
const filename = fileURLToPath(import.meta.url);
const path = dirname(filename);

app.register(autoLoad, {
  dir: join(path, "routes"),
});

// Run the server!
try {
  await app.listen({ host: "0.0.0.0", port: 8000 });
} catch (err) {
  app.log.error(err);
  throw new Error("Server failed to start");
}
