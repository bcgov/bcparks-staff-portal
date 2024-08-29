export default async function (fastify, opts) {
  // http://localhost:8000/
  // http://0.0.0.0:8000/
  fastify.get("/", async function (request, reply) {
    return { msg: "this is the homepage" };
  });

  // http://0.0.0.0:8000/time
  fastify.get("/time", async function (request, reply) {
    return { time: new Date() };
  });
}
