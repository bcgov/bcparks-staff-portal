import { Router } from "express";
import * as SEASON_STATUS from "../../constants/seasonStatus.js";
import * as USER_ROLES from "../../constants/userRoles.js";
import { checkPermissions } from "../../middleware/permissions.js";
import parkRoutes from "./parks.js";

const router = Router();

// Reuse parkRoutes for the Edit published page
// Get all parks with published seasons for the previous year
router.get("/", checkPermissions([USER_ROLES.APPROVER]), (req, res, next) => {
  const minOperatingYear = new Date().getFullYear() - 1;

  req.query = {
    ...req.query,
    seasonStatus: SEASON_STATUS.PUBLISHED,
    operatingYear: minOperatingYear,
  };

  parkRoutes.handle(req, res, next);
});

export default router;
