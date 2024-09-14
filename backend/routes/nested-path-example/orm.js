import DbRow from "../../db/models/DbRow.js";
import { Router } from "express";
import asyncHandler from "express-async-handler";
import checkJwt from "../../middleware/checkJwt.js";

const router = Router();

const routeHandler = asyncHandler(async (req, res) => {
  const { rowId } = req.params;

  const allRows = await DbRow.findAll();
  const specificRow = await DbRow.findByPk(rowId);

  if (!specificRow) {
    throw new Error(`Requested row does not exist: ${rowId}`);
  }

  res.json({ rowId, specificRow, numRows: allRows.length });
});

// example with Sequelize ORM 🔒 protected by Keycloak
// http://0.0.0.0:8100/nested-path-example/orm-2
router.get(
  "/orm-2",

  // protect this route with JWT authentication
  checkJwt,

  // manually set the URL parameter to 2 since this hardcoded example route doesn't use a parameter
  (req, res, next) => {
    req.params.rowId = 2;
    next();
  },

  // wrap in asyncHandler so thrown errors are caught and handled by Express
  // without needing to manually try/catch and call next(err)
  routeHandler,
);

// example with Sequelize ORM
// http://0.0.0.0:8100/nested-path-example/orm-1
// http://0.0.0.0:8100/nested-path-example/orm-<number>
router.get(
  "/orm-:rowId",
  // wrap in asyncHandler so thrown errors are caught and handled by Express
  // without needing to manually try/catch and call next(err)
  routeHandler,
);

export default router;
