// http://0.0.0.0:8000/nested-path-example/
export default async function (fastify) {
  fastify.get("/", async () => ({ msg: "hello world!" }));
}
