import { Router } from "express";
import { Season } from "../../models/index.js";
import * as USER_ROLES from "../../constants/userRoles.js";
import { checkPermissions } from "../../middleware/permissions.js";
import parkRoutes from "./parks.js";

const router = Router();

// Reuse parkRoutes for the previous-year edit page.
// Get all parks with seasons for the previous year, regardless of status or seasonType.
router.get(
  "/",
  checkPermissions([USER_ROLES.APPROVER]),
  async (req, res, next) => {
    // get the max season (latest operating year) from the db
    const maxSeason = await Season.findOne({
      order: [["operatingYear", "DESC"]],
    });

    // Group site and picnic shelter dates are collected a year before campsite dates
    // because they open for reservations 12 months in advance. As a result, the highest
    // operatingYear in the database is one year ahead of the active camping season.
    const campingDateCollectionYear = maxSeason?.operatingYear
      ? maxSeason.operatingYear - 1
      : new Date().getFullYear();
    const previousDateCollectionYear = campingDateCollectionYear - 1;

    req.query = {
      ...req.query,
      operatingYear: previousDateCollectionYear,
    };

    parkRoutes.handle(req, res, next);
  },
);

export default router;
