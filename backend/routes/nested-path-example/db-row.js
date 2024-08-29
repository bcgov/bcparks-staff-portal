import pgp from "pg-promise";

const db = pgp()(process.env.PG_CONNECTION_STRING);

// example with a manual query
// http://0.0.0.0:8000/nested-path-example/row-1
// http://0.0.0.0:8000/nested-path-example/row-2
export default async function (fastify) {
  fastify.get("/row-:rowId", async (request) => {
    const { rowId } = request.params;

    const dbRecords = await db.any(
      "SELECT * FROM example_table WHERE id = $<rowId>",
      { rowId },
    );

    return { rowId, dbRecords };
  });
}
