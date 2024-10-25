import { Router } from "express";
import {
  Park,
  Season,
  FeatureType,
  ParkFeature,
  SeasonChangeLog,
  User,
  FeatureDate,
  CampsiteGrouping,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/seasons/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: ["id", "year", "status", "orcs"],
      include: [
        {
          model: FeatureType,
          attributes: ["id", "name"],
        },
        {
          model: Park,
          attributes: ["id", "name", "orcs"],
        },
        {
          model: SeasonChangeLog,
          attributes: ["notes", "timestamp"],
          include: [
            {
              model: User,
              attributes: ["id", "idir"],
            },
          ],
        },
      ],
    });

    if (!seasonModel) {
      res.status(404);
      throw new Error("Season not found");
    }

    const season = seasonModel.get({ plain: true });

    const parkFeatures = await ParkFeature.findAll({
      where: {
        parkId: season.Park.id,
        active: true,
        featureTypeId: season.FeatureType.id,
      },
      attributes: ["id", "name", "hasReservations"],
      include: [
        {
          model: CampsiteGrouping,
          attributes: ["id", "siteRangeDescription"],
        },
        {
          model: FeatureType,
          attributes: ["id", "name"],
        },
        {
          model: FeatureDate,
          attributes: [
            "id",
            "operatingYear",
            "dateTypeId",
            "startDate",
            "endDate",
            "isDateRangeAnnual",
          ],
          where: { operatingYear: season.year },
        },
      ],
    });

    const features = parkFeatures.map((feature) =>
      feature.get({ plain: true }),
    );

    const output = {
      ...season,
      features,
    };

    res.json(output);
  }),
);

export default router;
