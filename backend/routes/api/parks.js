import { Router } from "express";
import _ from "lodash";
import {
  Park,
  Season,
  FeatureType,
  Publishable,
  DateRange,
  DateType,
  Feature,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

function getParkStatus(seasons) {
  // if any season has status==requested, return requested
  // else if any season has status==pending review, return pending review
  // else if any season has status==approved, return approved
  // if all seasons have status==on API, return on API

  const requested = seasons.some((s) => s.status === "requested");

  if (requested) {
    return "requested";
  }

  const pendingReview = seasons.some((s) => s.status === "pending review");

  if (pendingReview) {
    return "pending review";
  }

  const approved = seasons.some((s) => s.status === "approved");

  if (approved) {
    return "approved";
  }

  const onAPI = seasons.some((s) => s.status === "on API");

  if (onAPI) {
    return "on API";
  }

  return null;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parks = await Park.findAll({
      attributes: [
        "id",
        "orcs",
        "name",
        "managementAreas",
        "inReservationSystem",
      ],
      include: [
        {
          model: Feature,
          as: "features",
          attributes: ["id", "inReservationSystem"],
        },
        {
          model: Season,
          as: "seasons",
          attributes: ["id", "status", "readyToPublish"],
          required: true,
          include: [
            {
              model: Publishable,
              as: "publishable",
              attributes: ["id"],
              include: [
                {
                  model: FeatureType,
                  as: "featureType",
                  attributes: ["id", "name"],
                },
              ],
            },
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id"],
              include: [
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    const output = parks.map((park) => ({
      id: park.id,
      name: park.name,
      orcs: park.orcs,
      section: park.managementAreas.map((area) => area.section),
      managementArea: park.managementAreas.map((area) => area.mgmtArea),
      inReservationSystem: park.inReservationSystem,
      status: getParkStatus(park.seasons),
      features: park.features.map((feature) => ({
        id: feature.id,
        inReservationSystem: feature.inReservationSystem,
      })),
      seasons: park.seasons.map((season) => ({
        id: season.id,
        featureType: {
          id: season.publishable.featureType?.id,
          name: season.publishable.featureType?.name,
        },
        dateRanges: season.dateRanges.map((dateRange) => ({
          id: dateRange.id,
          dateType: {
            id: dateRange.dateType.id,
            name: dateRange.dateType.name,
          },
        })),
      })),
      readyToPublish: park.seasons.every((season) => season.readyToPublish),
    }));

    // Return all rows
    res.json(output);
  }),
);

router.get(
  "/:orcs",
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
            "editable",
            "updatedAt",
            "readyToPublish",
          ],
          include: [
            {
              model: Publishable,
              as: "publishable",
              attributes: ["id"],
              include: [
                {
                  model: FeatureType,
                  as: "featureType",
                  attributes: ["id", "name", "icon"],
                },
              ],
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

    const featureTypes = _.mapValues(
      // group seasons by feature type
      _.groupBy(parkJson.seasons, (s) => s.publishable.featureType?.name),

      // sort by year
      (group) => _.orderBy(group, ["operatingYear"], ["desc"]),
    );

    const winterFees = [];

    // move winter fees to the root object
    // so the frontend can treat it differently
    if ("Winter fee" in featureTypes) {
      winterFees.push(...featureTypes["Winter fee"]);
      delete featureTypes["Winter fee"];
    }

    // remove unused season key
    delete parkJson.seasons;

    res.json({ ...parkJson, featureTypes, winterFees });
  }),
);

export default router;
