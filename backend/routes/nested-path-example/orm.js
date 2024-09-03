import DbRow from "../../db/models/DbRow.js";
import { Router } from "express";

const router = Router();

// example with Sequelize ORM
// http://0.0.0.0:8000/nested-path-example/orm-1
// http://0.0.0.0:8000/nested-path-example/orm-2
router.get("/orm-:rowId", async (req, res) => {
  try {
    const { rowId } = req.params;

    const allRows = await DbRow.findAll();
    const specificRow = await DbRow.findByPk(rowId);

    res.json({ rowId, specificRow, numRows: allRows.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

export default router;
