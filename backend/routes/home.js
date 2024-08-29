export default async function (fastify) {
  // http://localhost:8000/
  // http://0.0.0.0:8000/
  fastify.get("/", async () => ({ msg: "this is the homepage" }));

  // http://0.0.0.0:8000/time
  fastify.get("/time", async () => ({ time: new Date() }));
}
