import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

import {
  Dateable,
  DateRange,
  DateType,
  Feature,
  FeatureType,
  GateDetail,
  Park,
  ParkArea,
  Season,
} from "../../models/index.js";

import {
  adminsAndApprovers,
  checkPermissions,
} from "../../middleware/permissions.js";

// @TODO: delete this deprecated file
import { get, post, put } from "./strapi-api.js";
import * as STATUS from "../../constants/seasonStatus.js";

const router = Router();

router.get(
  "/ready-to-publish",
  asyncHandler(async (req, res) => {
    // Get all seasons that are approved and ready to be published
    const approvedSeasons = await Season.findAll({
      where: {
        status: STATUS.APPROVED,
        // TODO: CMS-1153
        // readyToPublish: true,
      },
      attributes: ["id", "publishableId", "operatingYear", "readyToPublish"],
    });

    // Return if no seasons found
    if (!approvedSeasons || approvedSeasons.length === 0) {
      return res.send({ seasons: [] });
    }

    // Get all publishableIds and build a lookup
    const publishableIds = approvedSeasons.map((s) => s.publishableId);
    const publishableMap = new Map();

    // Return if no valid publishableIds
    if (publishableIds.length === 0) {
      return res.send({ seasons: [] });
    }

    // Find all parks, parkAreas, and features with matching publishableId
    const [parks, parkAreas, features] = await Promise.all([
      Park.findAll({
        where: { publishableId: { [Op.in]: publishableIds } },
        attributes: ["id", "publishableId", "name"],
      }),
      ParkArea.findAll({
        where: { publishableId: { [Op.in]: publishableIds } },
        attributes: ["id", "publishableId", "name"],
        include: [
          { model: Park, as: "park", attributes: ["id", "name"] },
          { model: Feature, as: "features", attributes: ["id", "name"] },
        ],
      }),
      Feature.findAll({
        where: { publishableId: { [Op.in]: publishableIds } },
        attributes: ["id", "publishableId", "name"],
        include: [
          { model: Park, as: "park", attributes: ["id", "name"] },
          { model: ParkArea, as: "parkArea", attributes: ["id", "name"] },
        ],
      }),
    ]);

    parks.forEach((park) =>
      publishableMap.set(park.publishableId, {
        type: "park",
        ...park.toJSON(),
      }),
    );
    parkAreas.forEach((parkArea) =>
      publishableMap.set(parkArea.publishableId, {
        type: "parkArea",
        ...parkArea.toJSON(),
      }),
    );
    features.forEach((feature) =>
      publishableMap.set(feature.publishableId, {
        type: "feature",
        ...feature.toJSON(),
      }),
    );

    // Build output
    const output = approvedSeasons.map((season) => {
      const publishable = publishableMap.get(season.publishableId);

      if (!publishable) {
        console.warn(
          `No publishable object found for publishableId: ${season.publishableId}`,
        );
      }

      // Extract names based on publishable type
      let parkName = "-";
      let parkAreaName = "-";
      let featureNames = [];

      if (publishable?.type === "park") {
        parkName = publishable.name || "-";
      } else if (publishable?.type === "parkArea") {
        parkName = publishable.park?.name || "-";
        parkAreaName = publishable.name || "-";
        const parkAreaFeatures = publishable.features;

        featureNames = Array.isArray(parkAreaFeatures)
          ? parkAreaFeatures
              .filter((parkFeature) => parkFeature && parkFeature.name)
              .map((parkFeature) => parkFeature.name)
          : [];
      } else if (publishable?.type === "feature") {
        parkName = publishable.park?.name || "-";
        parkAreaName = publishable.parkArea?.name || "-";
        featureNames = publishable.name ? [publishable.name] : [];
      }

      return {
        id: season.id,
        operatingYear: season.operatingYear,
        readyToPublish: season.readyToPublish,
        publishableType: publishable?.type ?? null,
        publishable: publishable ?? null,
        parkName,
        parkAreaName,
        featureNames,
      };
    });

    return res.send({ seasons: output });
  }),
);

// - send data to the API
router.post(
  "/publish-to-api/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    const seasonIds = req.body.seasonIds;

    console.log("Publishing to API...", seasonIds);

    const seasons = await Season.findAll({
      where: {
        id: { [Op.in]: seasonIds },
        status: STATUS.APPROVED,
        readyToPublish: true,
      },

      include: [
        // Entity details for park/area/feature
        {
          model: Park,
          as: "park",
          attributes: ["id", "publishableId", "name"],
        },
        {
          model: ParkArea,
          as: "parkArea",
          attributes: ["id", "publishableId", "name"],
        },
        {
          model: Feature,
          as: "feature",
          attributes: ["id", "publishableId", "name"],
        },

        // Gate details
        { model: GateDetail, as: "gateDetail" },
      ],
    });

    console.log("seasons");
    console.log(seasons);

    console.log(`Found ${seasons.length} seasons to publish`);

    // Build array of details for each season to be published, including:
    // - park/area/feature ID
    // - date ranges for the season
    // - gate details

    // foreach season ID:
    // - get all the dateranges for the season
    // get the park/area/feature for the season from the publishableId so we can get the orcs/id for strapi
    // get the gate info for the park/area/feature, also by publishableId

    // send 200 OK response with empty body
    res.send();
  }),
);

export default router;
