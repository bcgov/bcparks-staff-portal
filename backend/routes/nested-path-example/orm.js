import DbRow from "../../db/models/DbRow.js";

// example with Sequelize ORM
// http://0.0.0.0:8000/nested-path-example/orm-1
// http://0.0.0.0:8000/nested-path-example/orm-2
export default async function (fastify) {
  fastify.get("/orm-:rowId", async (request) => {
    const { rowId } = request.params;

    const allRows = await DbRow.findAll();

    const specificRow = await DbRow.findByPk(rowId);

    return { rowId, specificRow, numRows: allRows.length };
  });
}
