import { Router } from "express";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  Dateable,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

router.get(
  "/seasons/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: ["id", "operatingYear", "status"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
        },
        {
          model: Park,
          as: "park",
          attributes: ["id", "name", "orcs"],
        },
      ],
    });

    if (!seasonModel) {
      res.status(404);
      throw new Error("Season not found");
    }

    const season = seasonModel.get({ plain: true });

    const parkFeatures = await Feature.findAll({
      where: {
        parkId: season.park.id,
        active: true,
        featureTypeId: season.featureType.id,
      },
      attributes: ["id", "name", "hasReservations"],
      include: [
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id", "seasonId", "startDate", "endDate"],
              include: [
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name"],
                },
              ],
              where: { seasonId: season.id },
            },
          ],
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
