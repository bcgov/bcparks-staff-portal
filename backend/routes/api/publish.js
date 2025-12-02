import { Router } from "express";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";
import { format } from "date-fns";

import {
  DateRange,
  DateRangeAnnual,
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

import * as STATUS from "../../constants/seasonStatus.js";
import strapiApi from "../../utils/strapiApi.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import splitArray from "../../utils/splitArray.js";

const router = Router();

const FEATURE_ATTRIBUTES = [
  "id",
  "publishableId",
  "dateableId",
  "strapiOrcsFeatureNumber",
];

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
          {
            model: Feature,
            as: "features",
            attributes: ["id", "name"],
            include: [
              {
                model: FeatureType,
                as: "featureType",
                attributes: ["strapiFeatureTypeId"],
              },
            ],
          },
        ],
      }),
      Feature.findAll({
        where: { publishableId: { [Op.in]: publishableIds } },
        attributes: ["id", "publishableId", "name"],
        include: [
          { model: Park, as: "park", attributes: ["id", "name"] },
          { model: ParkArea, as: "parkArea", attributes: ["id", "name"] },
          {
            model: FeatureType,
            as: "featureType",
            attributes: ["strapiFeatureTypeId"],
          },
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

        where: {
          // @TEMP: Filter out FCFS dates while they're being hidden in the UI
          strapiDateTypeId: {
            [Op.ne]: DATE_TYPE.FIRST_COME_FIRST_SERVED,
          },
        },
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
 * @returns {Object|null} Formatted park data for publishing, or null to skip publishing
 */
async function formatParkData(park, season) {
  // Return null to skip publishing if the ORCS code is missing
  // We can't connect to anything in Strapi without this key
  if (!park.orcs) return null;

  const dateRanges = await formatDateRanges(park, season);
  const gateInfo = formatGateInfo(park.gateDetails);

  // Return formatted Park data
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
 * @returns {Object|null} Formatted feature data for publishing, or null to skip publishing
 */
async function formatFeatureData(feature, season) {
  // Return null to skip publishing if the ORCS Feature Number is missing
  // We can't connect to anything in Strapi without this key
  if (!feature.strapiOrcsFeatureNumber) return null;

  const dateRanges = await formatDateRanges(feature, season);
  const gateInfo = formatGateInfo(feature.gateDetails);

  // Return formatted Feature data
  return {
    orcsFeatureNumber: feature.strapiOrcsFeatureNumber,
    operatingYear: season.operatingYear,
    dateRanges,
    gateInfo,
  };
}

/**
 * Formats ParkArea data for publishing, including all Features within the ParkArea.
 * @param {ParkArea} parkArea The ParkArea object
 * @param {Season} season The season object
 * @returns {Array|null} Array of formatted data objects for the Area and its Features, or null to skip publishing
 */
async function formatParkAreaData(parkArea, season) {
  // Return null to skip publishing if the ORCS Area Number is missing
  // We can't connect to anything in Strapi without this key
  if (!parkArea.strapiOrcsAreaNumber) return null;

  const gateInfo = formatGateInfo(parkArea.gateDetails);

  // Format ParkArea data
  const formattedParkArea = {
    orcsAreaNumber: parkArea.strapiOrcsAreaNumber,
    operatingYear: season.operatingYear,
    gateInfo,
  };

  // Get all Features in this ParkArea
  const features = await parkArea.getFeatures({
    attributes: FEATURE_ATTRIBUTES,

    where: { active: true },
  });

  // Fetch and format data for each Feature in the ParkArea
  const formattedFeatures = [];

  for (const feature of features) {
    const featureData = await formatFeatureData(feature, season);

    // If the formatting function returned null for any reason,
    // skip publishing this Feature
    if (!featureData) continue;

    formattedFeatures.push(featureData);
  }

  return [formattedParkArea, ...formattedFeatures];
}

// Send data to the API
// For a list of season IDs, fetch the season data from our DB and send it to Strapi
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

          attributes: ["id", "publishableId", "strapiOrcsAreaNumber"],

          include: [
            {
              model: GateDetail,
              as: "gateDetails",
            },
          ],
        },

        {
          model: Feature,
          as: "feature",

          attributes: FEATURE_ATTRIBUTES,

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

    if (seasons.length === 0) {
      // Skip sending to Strapi if there are no seasons to publish
      console.error("No seasons found to publish.");
      res.status(400).json({
        error: "No seasons found to publish.",
      });
      return;
    }

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

        // If the formatting function returned null for any reason,
        // skip publishing this Park
        if (!parkData) continue;

        // Add formatted park data to publishing payload
        publishData.push(parkData);
        publishedSeasonIds.push(season.id);
      } else if (publishableEntity.type === "feature") {
        // If the season is for a Feature, fetch the Feature's dates and format the data
        const featureData = await formatFeatureData(
          publishableEntity.feature,
          season,
        );

        // If the formatting function returned null for any reason,
        // skip publishing this Feature
        if (!featureData) continue;

        // Add formatted feature data to publishing payload
        publishData.push(featureData);
        publishedSeasonIds.push(season.id);
      } else if (publishableEntity.type === "parkArea") {
        // If the season is for a Park Area, fetch the Park Area's feature dates and format the data
        const parkAreaData = await formatParkAreaData(
          publishableEntity.parkArea,
          season,
        );

        // If the formatting function returned null for any reason,
        // skip publishing this Park Area and its Features
        if (!parkAreaData) continue;

        // Add formatted park area and feature data to publishing payload
        publishData.push(...parkAreaData);
        publishedSeasonIds.push(season.id);
      }
    }

    // If there are some seasons, but they can't be published due to incomplete data
    // (Missing ORCS codes, etc), then quit and return an error
    if (publishData.length === 0) {
      console.error(
        "No valid publishable data could be generated for the selected seasons.",
      );
      res.status(400).json({
        error:
          "No valid publishable data could be generated for the selected seasons.",
      });
      return;
    }

    // Split publishData into chunks of ~500KB to avoid exceeding Strapi API limits
    const publishDataChunks = splitArray(publishData, 500 * 1024);

    // Use the first item's operating year as numericData for all chunks
    const numericData = publishData[0].operatingYear;

    // Send each chunk to the Strapi API with a brief delay
    for (const [index, chunk] of publishDataChunks.entries()) {
      // Send chunk of publish data to Strapi API
      await strapiApi.post("/queued-tasks", {
        data: {
          action: "doot publish",
          numericData,
          jsonData: chunk,
        },
      });

      // Sleep if there are more chunks remaining
      if (index < publishDataChunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms
      }
    }

    // Update season status from publishedSeasonIds
    await Season.update(
      { status: STATUS.PUBLISHED },
      { where: { id: { [Op.in]: publishedSeasonIds } } },
    );

    // Send 200 OK response with empty body
    res.send();
  }),
);

export default router;
