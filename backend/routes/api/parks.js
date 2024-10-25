import { Router } from "express";
import {
  Park,
  Bundle,
  Season,
  FeatureType,
  ParkFeature,
} from "../../models/index.js";
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
          model: Bundle,
          attributes: ["id", "name", "parkOperatorId"],
        },
        {
          model: Season,
          attributes: ["id", "year", "orcs", "status"],
          include: [
            {
              model: FeatureType,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: ParkFeature,
          attributes: ["id", "hasReservations"],
        },
      ],
    });

    const parks = parksWithBundlesAndSeasons.map((park) =>
      park.get({ plain: true }),
    );

    const output = parks.map((park) => ({
      id: park.id,
      name: park.name,
      bundles: park.Bundles.map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        parkOperatorId: bundle.parkOperatorId,
      })),
      orcs: park.orcs,
      status: getParkStatus(park.Seasons),
      hasReservations: park.ParkFeatures.some(
        (feature) => feature.hasReservations && feature.active,
      ),
    }));

    // Return all rows
    res.json({ parks: output });
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
          model: Bundle,
          attributes: ["id", "name", "parkOperatorId"],
        },
        {
          model: Season,
          attributes: ["id", "year", "orcs", "status", "updatedAt"],
          include: [
            {
              model: FeatureType,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!park) {
      throw new Error(`Park not found: ${orcs}`);
    }

    const ouput = park.get({ plain: true });

    res.json({ ouput });
  }),
);

export default router;
