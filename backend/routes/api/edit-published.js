import { Router } from "express";
import * as SEASON_STATUS from "../../constants/seasonStatus.js";
import * as USER_ROLES from "../../constants/userRoles.js";
import { checkPermissions } from "../../middleware/permissions.js";
import parkRoutes from "./parks.js";

const router = Router();

// Reuse parks response for the Edit published page API, but only for published seasons.
router.get("/", checkPermissions([USER_ROLES.APPROVER]), (req, res, next) => {
  req.query = {
    ...req.query,
    seasonStatus: SEASON_STATUS.PUBLISHED,
  };

  parkRoutes.handle(req, res, next);
});

export default router;
