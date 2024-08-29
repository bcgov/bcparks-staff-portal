import pgp from "pg-promise";

const db = pgp()(process.env.PG_CONNECTION_STRING);

// http://0.0.0.0:8000/nested-path-example/row-2
// http://0.0.0.0:8000/nested-path-example/row-2
export default async function (fastify, opts) {
  fastify.get("/row-:rowId", async function (request, reply) {
    const { rowId } = request.params;

    const dbRecords = await db.any(
      "SELECT * FROM example_table WHERE id = $<rowId>",
      { rowId },
    );

    return { rowId, dbRecords };
  });
}
