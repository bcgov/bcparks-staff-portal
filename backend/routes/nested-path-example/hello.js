// http://0.0.0.0:8000/nested-path-example/
export default async function (fastify, opts) {
  fastify.get("/", async function (request, reply) {
    return { msg: "hello world!" };
  });
}
