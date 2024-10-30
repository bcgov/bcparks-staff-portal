import { Router } from "express";
import { Park, Season, FeatureType, Feature } from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

function getParkStatus(seasons) {
  // if any season has status==requested, return requested
  // else if any season has status==under_review, return under_review
  // else if any season has status==approved, return approved
  // if all seasons have status==published, return published

  const requested = seasons.some((s) => s.status === "requested");

  if (requested) {
    return "requested";
  }

  const underReview = seasons.some((s) => s.status === "under_review");

  if (underReview) {
    return "under_review";
  }

  const approved = seasons.some((s) => s.status === "approved");

  if (approved) {
    return "approved";
  }

  const published = seasons.every((s) => s.status === "published");

  if (published) {
    return "published";
  }

  return null;
}

router.get(
  "/parks/",
  asyncHandler(async (req, res) => {
    const parksWithBundlesAndSeasons = await Park.findAll({
      attributes: ["id", "orcs", "name"],
      include: [
        {
          model: Season,
          as: "seasons",
          attributes: ["id", "status"],
        },
        {
          model: Feature,
          as: "features",
          attributes: ["id", "hasReservations"],
        },
      ],
    });

    const parks = parksWithBundlesAndSeasons.map((park) => park.toJSON());

    const output = parks.map((park) => ({
      id: park.id,
      name: park.name,
      orcs: park.orcs,
      status: getParkStatus(park.seasons),
      hasReservations: park.features.some(
        (feature) => feature.hasReservations && feature.active,
      ),
    }));

    // Return all rows
    res.json(output);
  }),
);

router.get(
  "/parks/:orcs",
  asyncHandler(async (req, res) => {
    const { orcs } = req.params;

    const park = await Park.findOne({
      where: { orcs },
      attributes: ["orcs", "name"],
      include: [
        {
          model: Season,
          as: "seasons",
          attributes: ["id", "operatingYear", "status", "updatedAt"],
          include: [
            {
              model: FeatureType,
              as: "featureType",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!park) {
      const error = new Error(`Park not found: ${orcs}`);

      error.status = 404;
      throw error;
    }

    const output = park.toJSON();

    res.json(output);
  }),
);

export default router;
