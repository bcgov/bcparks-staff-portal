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

/**
 * Returns the publishable entity (park, park area, or feature) for a given season.
 * @param {Season} season The season object to check
 * @returns {Object|null} Object with the type and publishable entity, or null if not found
 */
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

/**
 * Formats a Date object to 'YYYY-MM-DD' string format.
 * @param {Date} date The date to format
 * @returns {string} The formatted date string
 */
function formatDate(date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * Fetches date ranges for an entity and season, and formats them for publishing.
 * @param {Object} entity The entity object (e.g., Park, Feature)
 * @param {Season} season The season object
 * @returns {Array} Array of formatted DateRange objects
 */
async function formatDateRanges(entity, season) {
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

  // Get all the DateRangeAnnual data for this season/entity
  const dateRangeAnnualsRows = await DateRangeAnnual.findAll({
    where: {
      dateableId: entity.dateableId,
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
  return dateRangesRows.map((dateRange) => {
    // Look for a matching DateRangeAnnual entry for this date type
    let isDateAnnual = false;
    const dateRangeAnnualData = dateRangeAnnualsByDateType.get(
      dateRange.dateTypeId,
    );

    if (dateRangeAnnualData) {
      isDateAnnual = dateRangeAnnualData.isDateRangeAnnual;
    }

    return {
      isActive: true, // Must be true if the entity has dates being published
      isDateAnnual,
      startDate: formatDate(dateRange.startDate),
      endDate: formatDate(dateRange.endDate),
      adminNote: "", // Currently no admin note field in DateRange
      dateTypeId: dateRange.dateType.strapiDateTypeId,
    };
  });
}

/**
 * Formats gate details with default values for missing fields.
 * @param {GateDetail} [gateDetails={}] The gate details object (or null, if not found)
 * @returns {Object} Formatted gate info with all required fields
 */
function formatGateInfo(gateDetails = {}) {
  return {
    hasGate: gateDetails.hasGate ?? false,
    gateOpenTime: gateDetails.gateOpenTime ?? null,
    gateCloseTime: gateDetails.gateCloseTime ?? null,
    gateOpensAtDawn: gateDetails.gateOpensAtDawn ?? false,
    gateClosesAtDusk: gateDetails.gateClosesAtDusk ?? false,
    gateOpen24Hours: gateDetails.gateOpen24Hours ?? false,
    gateNote: "", // Currently no note field in GateDetails
  };
}

/**
 * Fetches and formats Park-level data for publishing.
 * @param {Park} park The Park object for the season
 * @param {Season} season The season object
 * @returns {Object} Formatted park data for publishing
 */
async function formatParkData(park, season) {
  const dateRanges = await formatDateRanges(park, season);
  const gateInfo = formatGateInfo(park.gateDetails);

  // Return formatted park data
  return {
    // Strapi expects the ORCS code as a number
    orcs: Number(park.orcs),
    operatingYear: season.operatingYear,
    dateRanges,
    gateInfo,
  };
}

/**
 * Fetches and formats Feature-level data for publishing.
 * @param {Feature} feature The Feature object for the season
 * @param {Season} season The season object
 * @returns {Object} Formatted feature data for publishing
 */
async function formatFeatureData(feature, season) {
  const dateRanges = await formatDateRanges(feature, season);
  const gateInfo = formatGateInfo(feature.gateDetails);

  // Return formatted park data
  return {
    // Strapi expects the ORCS code as a number
    orcsFeatureNumber: feature.strapiOrcsFeatureNumber,
    operatingYear: season.operatingYear,
    dateRanges,
    gateInfo,
  };
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
          attributes: ["id", "orcs", "publishableId", "dateableId"],

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
          attributes: ["id", "publishableId"],
        },

        {
          model: Feature,
          as: "feature",
          attributes: [
            "id",
            "publishableId",
            "dateableId",
            "strapiOrcsFeatureNumber",
          ],

          include: [
            {
              model: GateDetail,
              as: "gateDetails",
            },
          ],
        },
      ],
    });

    // Build array of details for each season to be published
    const publishData = [];

    // Keep an array of processed season IDs so we can update the status
    const publishedSeasonIds = [];

    for (const season of seasons) {
      const publishableEntity = getPublishableEntity(season);

      if (!publishableEntity) {
        console.warn(
          `No publishable entity found for publishableId: ${season.publishableId} (season ID: ${season.id})`,
        );
        continue;
      }

      if (publishableEntity.type === "park") {
        // If the Season is for a Park, fetch the Park-level dates and format the data
        const parkData = await formatParkData(publishableEntity.park, season);

        // Add formatted park data to publishing payload
        publishData.push(parkData);
        publishedSeasonIds.push(season.id);
      } else if (publishableEntity.type === "feature") {
        // If the season is for a Feature, fetch the Feature's dates and format the data
        console.log("this one is a feature");
        const featureData = await formatFeatureData(
          publishableEntity.feature,
          season,
        );

        // Add formatted feature data to publishing payload
        publishData.push(featureData);
        publishedSeasonIds.push(season.id);
      } else if (publishableEntity.type === "parkArea") {
        // @TODO: If the season is for a Park Area, fetch the Park Area's feature dates and format the data
      }
    }

    // TODO: Send publishData to Strapi API
    console.log("Prepared publish data:");
    console.log(JSON.stringify(publishData, null, 2));

    // @TODO: Update season status from publishedSeasonIds

    // Send 200 OK response with empty body
    res.send();
  }),
);

export default router;
