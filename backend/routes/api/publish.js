import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";
import { format } from "date-fns";

import {
  DateRange,
  DateRangeAnnual,
  DateType,
  Feature,
  GateDetail,
  Park,
  ParkArea,
  Season,
} from "../../models/index.js";

import {
  adminsAndApprovers,
  checkPermissions,
} from "../../middleware/permissions.js";

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
          `No publishable entity found for publishableId: ${season.publishableId}`,
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

// Returns the publishable entity (park, park area, or feature) for a given season
function getPublishableEntity(season) {
  if (season?.feature) {
    return {
      type: "feature",
      feature: season.feature,
    };
  }

  if (season?.parkArea) {
    return {
      type: "parkArea",
      parkArea: season.parkArea,
    };
  }

  if (season?.park) {
    return {
      type: "park",
      park: season.park,
    };
  }

  return null;
}

// Formats a Date object to 'YYYY-MM-DD' string format
function formatDate(date) {
  return format(date, "yyyy-MM-dd");
}

// - send data to the API
router.post(
  "/publish-to-api/",
  checkPermissions(adminsAndApprovers),
  asyncHandler(async (req, res) => {
    const seasonIds = req.body.seasonIds;

    // Fetch all approved seasons that are ready to publish
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
          attributes: ["id", "orcs", "publishableId", "dateableId", "name"],

          include: [
            {
              model: GateDetail,
              as: "gateDetails",
            },
          ],
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
      ],
    });

    // Build array of details for each season to be published
    const publishData = [];

    for (const season of seasons) {
      const publishableEntity = getPublishableEntity(season);

      if (!publishableEntity) {
        console.warn(
          `No publishable entity found for publishableId: ${season.publishableId} (season ID: ${season.id})`,
        );
        continue;
      }

      // If the Season is for a Park, fetch the Park-level dates and format the data
      if (publishableEntity.type === "park") {
        const park = publishableEntity.park;

        // Fetch all date ranges for this season
        const dateRangesRows = await DateRange.findAll({
          attributes: ["startDate", "endDate", "dateTypeId"],

          where: {
            seasonId: season.id,
          },

          include: [
            {
              model: DateType,
              as: "dateType",
              attributes: ["id", "strapiDateTypeId"],
            },
          ],
        });

        // Get all the DateRangeAnnual data for this season/park
        const dateRangeAnnualsRows = await DateRangeAnnual.findAll({
          where: {
            dateableId: park.dateableId,
            publishableId: season.publishableId,
          },
        });

        // Create a map to look up dateRangeAnnual by dateTypeId
        const dateRangeAnnualsByDateType = new Map(
          dateRangeAnnualsRows.map((dateRangeAnnual) => [
            dateRangeAnnual.dateTypeId,
            dateRangeAnnual,
          ]),
        );

        // Transform date ranges to API format
        const dateRanges = dateRangesRows.map((dateRange) => {
          // Look for a matching DateRangeAnnual entry for this date type
          let isDateAnnual = false;
          const dateRangeAnnualData = dateRangeAnnualsByDateType.get(
            dateRange.dateTypeId,
          );

          if (dateRangeAnnualData) {
            isDateAnnual = dateRangeAnnualData.isDateRangeAnnual;
          }

          return {
            isActive: true, // Must be true if the park has dates being published
            isDateAnnual,
            startDate: formatDate(dateRange.startDate),
            endDate: formatDate(dateRange.endDate),
            adminNote: "", // Currently no admin note field in DateRange
            dateTypeId: dateRange.dateType.strapiDateTypeId,
          };
        });

        // Extract gate information with defaults for missing data
        const gateDetails = park.gateDetails ?? {};

        const gateInfo = {
          hasGate: gateDetails.hasGate ?? false,
          gateOpenTime: gateDetails.gateOpenTime ?? null,
          gateCloseTime: gateDetails.gateCloseTime ?? null,
          gateOpensAtDawn: gateDetails.gateOpensAtDawn ?? false,
          gateClosesAtDusk: gateDetails.gateClosesAtDusk ?? false,
          gateOpen24Hours: gateDetails.gateOpen24Hours ?? false,
          gateNote: "", // Currently no note field in GateDetails
        };

        // Add formatted park data to publish array
        publishData.push({
          // Strapi expects the ORCS code as a number
          orcs: Number(park.orcs),
          operatingYear: season.operatingYear,
          dateRanges,
          gateInfo,
        });
      }

      // @TODO: If the season is for a Park Area, fetch the Park Area's feature dates and format the data

      // @TODO: If the season is for a Feature, fetch the Feature's dates and format the data
    }

    // TODO: Send publishData to Strapi API
    console.log("Prepared publish data:");
    console.log(JSON.stringify(publishData, null, 2));

    // Send 200 OK response with empty body
    res.send();
  }),
);

export default router;
