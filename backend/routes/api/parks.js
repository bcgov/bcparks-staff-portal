import { Router } from "express";
import _ from "lodash";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  Dateable,
  DateRange,
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

  const underReview = seasons.some((s) => s.status === "under review");

  if (underReview) {
    return "under review";
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
          attributes: ["id", "status", "readyToPublish"],
        },
        {
          model: Feature,
          as: "features",
          attributes: ["id", "hasReservations"],
          include: [
            {
              model: Dateable,
              as: "dateable",
              attributes: ["id"],
              include: [
                {
                  model: DateRange,
                  as: "dateRanges",
                  attributes: ["id"],
                },
              ],
            },
          ],
        },
      ],
    });

    const parks = parksWithBundlesAndSeasons.map((park) => park.toJSON());

    const output = parks
      .filter((item) =>
        item.features.some((feature) => feature.dateable.dateRanges.length > 0),
      )
      .map((park) => ({
        id: park.id,
        name: park.name,
        orcs: park.orcs,
        status: getParkStatus(park.seasons),
        hasReservations: park.features.some(
          (feature) => feature.hasReservations && feature.active,
        ),
        readyToPublish: park.seasons.every((s) => s.readyToPublish),
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
          attributes: [
            "id",
            "operatingYear",
            "status",
            "updatedAt",
            "readyToPublish",
          ],
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

    const parkJson = park.toJSON();

    const subAreas = _.mapValues(
      // group seasons by feature type
      _.groupBy(parkJson.seasons, (s) => s.featureType.name),

      // sort by year
      (group) => _.orderBy(group, ["operatingYear"], ["desc"]),
    );

    // remove unused season key
    delete parkJson.seasons;

    res.json({ ...parkJson, subAreas });
  }),
);

export default router;
