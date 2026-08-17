import { Router } from "express";
import asyncHandler from "express-async-handler";
import * as USER_ROLES from "../../constants/userRoles.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { checkPermissions } from "../../middleware/permissions.js";
import parkRoutes from "./parks.js";

const router = Router();

// Reuse parkRoutes for the previous-year edit page.
// Get all parks with seasons for the previous year, regardless of status or seasonType.
router.get(
  "/",
  checkPermissions([USER_ROLES.DOOT_APPROVER]),
  asyncHandler(async (req, res, next) => {
    req.query = {
      ...req.query,
    };

    const originalJson = res.json.bind(res);

    res.json = (parks) => {
      const filtered = parks.map((park) => ({
        ...park,
        parkAreas: park.parkAreas.map((parkArea) => ({
          ...parkArea,
          seasons: parkArea.seasons.filter((season) => {
            if (season.seasonType === SEASON_TYPE.REGULAR) {
              return (
                season.operatingYear ===
                parkArea.currentSeason?.regular?.operatingYear - 1
              );
            }

            if (season.seasonType === SEASON_TYPE.WINTER) {
              return (
                season.operatingYear ===
                parkArea.currentSeason?.winter?.operatingYear - 1
              );
            }

            return true;
          }),
        })),
      }));

      return originalJson(filtered);
    };

    return next();
  }),
  parkRoutes,
);

export default router;
