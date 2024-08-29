import pgp from "pg-promise";
import fastify from "fastify";

if (!process.env.PG_CONNECTION_STRING) {
  throw new Error("Required environment variables are not set");
}

const app = fastify({
  logger: true,
});

// Declare a route
app.get("/", async (request, reply) => ({ hello: "world" }));

// Run the server!
try {
  await app.listen({ host: "0.0.0.0", port: 8000 });
} catch (err) {
  app.log.error(err);
  throw new Error("Server failed to start");
}
