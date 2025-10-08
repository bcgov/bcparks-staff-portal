import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

import {
  Park,
  Season,
  Feature,
  DateRange,
  DateType,
  Dateable,
  ParkArea,
  FeatureType,
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
        seasonId: season.id,
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
    console.log("Publishing to API...");

    // send 200 OK response with empty body
    res.send();
  }),
);

export default router;
