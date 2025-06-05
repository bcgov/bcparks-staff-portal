import { Op } from "sequelize";
import { Router } from "express";
import _ from "lodash";
import {
  Park,
  Season,
  FeatureType,
  DateRange,
  DateType,
  Feature,
  ParkArea,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

// Constants
const router = Router();
const currentYear = new Date().getFullYear();
const minYear = currentYear - 1;

const seasonModel = {
  model: Season,
  as: "seasons",
  attributes: [
    "id",
    "publishableId",
    "featureTypeId",
    "status",
    "readyToPublish",
    "operatingYear",
  ],
  // filter seasons with operatingYear >= minYear
  where: {
    operatingYear: {
      [Op.gte]: minYear,
    },
  },
  include: [
    {
      model: DateRange,
      as: "dateRanges",
      attributes: ["id", "dateableId", "startDate", "endDate"],
      include: [
        {
          model: DateType,
          as: "dateType",
          attributes: ["id", "name"],
        },
      ],
    },
  ],
};

// Functions
// get all date ranges from seasons
function getAllDateRanges(seasons) {
  return _.flatMap(seasons, (season) => season.dateRanges);
}

// get publishable item status from seasons
function getStatus(seasons) {
  // @TODO: fix this
  if (!seasons) return "requested";

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

// group dateRanges by date type name then by year
// e.g. {Operation: {2024: [...], 2025: [...]}, Winter: {2024: [...], 2025: [...]}, ...}
function groupDateRangesByTypeAndYear(dateRanges) {
  // filter out invalid dateRanges
  const validRanges = dateRanges.filter(
    (dateRange) => dateRange.dateType && dateRange.startDate,
  );

  // group by dateType name
  return _.mapValues(
    _.groupBy(validRanges, (dateRange) => dateRange.dateType.name),
    (ranges) =>
      _.groupBy(ranges, (dateRange) =>
        new Date(dateRange.startDate).getFullYear(),
      ),
  );
}

// build a date range output object
function buildDateRangeObject(dateRange) {
  return {
    id: dateRange.id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateType: dateRange.dateType
      ? {
          id: dateRange.dateType.id,
          name: dateRange.dateType.name,
        }
      : null,
  };
}

// build feature output object
function buildFeatureOutput(feature) {
  // get date ranges for park.feature
  const featureDateRanges = getAllDateRanges(feature.seasons).map(
    buildDateRangeObject,
  );

  return {
    id: feature.id,
    dateableId: feature.dateableId,
    publishableId: feature.publishableId,
    parkAreaId: feature.parkAreaId,
    name: feature.name,
    inReservationSystem: feature.inReservationSystem,
    featureType: {
      id: feature.featureType.id,
      publishableId: feature.featureType.publishableId,
      name: feature.featureType.name,
    },
    seasons: feature.seasons,
    status: getStatus(feature.seasons),
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const parks = await Park.findAll({
      attributes: [
        "id",
        "dateableId",
        "publishableId",
        "orcs",
        "name",
        "managementAreas",
        "inReservationSystem",
      ],
      include: [
        // Publishable Features that aren't part of a ParkArea
        {
          model: Feature,
          as: "features",
          where: {
            parkAreaId: null,
          },
          required: false,
          attributes: [
            "id",
            "dateableId",
            "publishableId",
            "parkAreaId",
            "name",
            "inReservationSystem",
          ],
          include: [
            {
              model: FeatureType,
              as: "featureType",
              attributes: ["id", "publishableId", "name"],
            },
            // Publishable and Dates for the Feature
            seasonModel,
          ],
        },

        // Park areas
        {
          model: ParkArea,
          as: "parkAreas",
          attributes: ["id", "dateableId", "publishableId", "name"],

          include: [
            // Features that are part of the ParkArea
            {
              model: Feature,
              as: "features",
              attributes: [
                "id",
                "dateableId",
                "publishableId",
                "parkAreaId",
                "name",
                "inReservationSystem",
              ],
              include: [
                {
                  model: FeatureType,
                  as: "featureType",
                  attributes: ["id", "publishableId", "name"],
                },
                // Publishable and Dates for the Feature
                {
                  model: Season,
                  as: "seasons",
                  attributes: [
                    "id",
                    "publishableId",
                    "featureTypeId",
                    "status",
                    "readyToPublish",
                    "operatingYear",
                  ],
                  where: {
                    operatingYear: {
                      [Op.gte]: minYear,
                    },
                  },
                  include: [
                    {
                      model: DateRange,
                      as: "dateRanges",
                      attributes: ["id", "dateableId", "startDate", "endDate"],
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
            },
            // Publishable and Dates for the ParkArea
            {
              model: Season,
              as: "seasons",
              attributes: [
                "id",
                "publishableId",
                "featureTypeId",
                "status",
                "readyToPublish",
                "operatingYear",
              ],
              where: {
                operatingYear: {
                  [Op.gte]: minYear,
                },
              },
              include: [
                {
                  model: DateRange,
                  as: "dateRanges",
                  attributes: ["id", "dateableId", "startDate", "endDate"],
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
        },

        // Publishable Seasons for the Park itself
        // itemDates,
        {
          model: Season,
          as: "seasons",
          attributes: [
            "id",
            "publishableId",
            "featureTypeId",
            "status",
            "readyToPublish",
            "operatingYear",
          ],
          where: {
            operatingYear: {
              [Op.gte]: minYear,
            },
          },
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id", "dateableId", "startDate", "endDate"],
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
      order: [
        ["name", "ASC"],
        [{ model: ParkArea, as: "parkAreas" }, "name", "ASC"],
        [{ model: Feature, as: "features" }, "name", "ASC"],
      ],
    });

    const output = parks.map((park) => {
      // get date ranges for park
      // filter allDateRanges by park.dateableId
      const parkDateRanges = getAllDateRanges(park.seasons).map(
        buildDateRangeObject,
      );

      return {
        id: park.id,
        dateableId: park.dateableId,
        publishableId: park.publishableId,
        name: park.name,
        orcs: park.orcs,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        inReservationSystem: park.inReservationSystem,
        status: getStatus(park.seasons),
        groupedDateRanges: groupDateRangesByTypeAndYear(parkDateRanges),
        features: park.features.map((feature) => buildFeatureOutput(feature)),
        parkAreas: park.parkAreas?.map((parkArea) => {
          // get date ranges for park.parkArea
          const parkAreaDateRanges = getAllDateRanges(parkArea.seasons).map(
            buildDateRangeObject,
          );

          // add featureType to parkArea if all features have the same featureType
          let featureType = null;

          if (
            parkArea.features.length > 0 &&
            parkArea.features.every(
              (parkAreaFeature) =>
                parkAreaFeature.featureType &&
                parkAreaFeature.featureType.id ===
                  parkArea.features[0].featureType.id,
            )
          ) {
            featureType = { ...parkArea.features[0].featureType };
          }

          return {
            id: parkArea.id,
            dateableId: parkArea.dateableId,
            publishableId: parkArea.publishableId,
            name: parkArea.name,
            features: parkArea.features,
            ...(featureType && { featureType }),
            seasons: parkArea.seasons,
            status: getStatus(parkArea.seasons),
            groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
          };
        }),
        seasons: park.seasons?.map((season) => ({
          id: season.id,
          publishableId: season.publishableId,
          operatingYear: season.operatingYear,
          status: season.status,
          readyToPublish: season.readyToPublish,
          dateRanges: season.dateRanges.map(buildDateRangeObject),
        })),
        readyToPublish: park.seasons?.every((season) => season.readyToPublish),
      };
    });

    // Return all rows
    res.json(output);
  }),
);

export default router;
