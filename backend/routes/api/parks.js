import { Op } from "sequelize";
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
  ParkArea,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

// Functions
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

// group dateRanges by date type name then by year
// e.g. {Operation: {2024: [...], 2025: [...]}, Winter: {2024: [...], 2025: [...]}, ...}
function groupDateRangesByTypeAndYear(dateRanges) {
  const grouped = {};

  dateRanges.forEach((dateRange) => {
    if (!dateRange.dateType || !dateRange.startDate) return;

    const type = dateRange.dateType.name;
    const startYear = new Date(dateRange.startDate).getFullYear();

    if (!grouped[type]) grouped[type] = {};
    if (!grouped[type][startYear]) grouped[type][startYear] = [];
    grouped[type][startYear].push({
      id: dateRange.id,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
  });
  return grouped;
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
function buildFeatureOutput(feature, allDateRanges) {
  // get date ranges for park.feature
  // filter allDateRanges by feature.dateableId
  const featureDateRanges = allDateRanges
    .filter((dateRange) => dateRange.dateableId === feature.dateableId)
    .map(buildDateRangeObject);

  return {
    id: feature.id,
    dateableId: feature.dateableId,
    publishableId: feature.publishableId,
    parkAreaId: feature.parkAreaId,
    name: feature.name,
    inReservationSystem: feature.inReservationSystem,
    featureType: {
      id: feature.featureType.id,
      name: feature.featureType.name,
    },
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 1;

    const parks = await Park.findAll({
      attributes: [
        "id",
        "dateableId",
        "orcs",
        "name",
        "managementAreas",
        "inReservationSystem",
      ],
      include: [
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
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: ParkArea,
          as: "parkAreas",
          attributes: ["id", "dateableId", "publishableId", "name"],
          // filter parkAreas that are publishable
          where: {
            publishableId: {
              [Op.ne]: null,
            },
          },
        },
        {
          model: Season,
          as: "seasons",
          attributes: ["id", "status", "readyToPublish", "operatingYear"],
          required: true,
          // filter seasons with operatingYear >= minYear
          where: {
            operatingYear: {
              [Op.gte]: minYear,
            },
          },
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
      const allDateRanges = _.flatMap(
        park.seasons,
        (season) => season.dateRanges,
      );

      // get date ranges for park
      // filter allDateRanges by park.dateableId
      const parkDateRanges = allDateRanges
        .filter((dateRange) => dateRange.dateableId === park.dateableId)
        .map(buildDateRangeObject);

      return {
        id: park.id,
        dateableId: park.dateableId,
        name: park.name,
        orcs: park.orcs,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        inReservationSystem: park.inReservationSystem,
        status: getParkStatus(park.seasons),
        groupedDateRanges: groupDateRangesByTypeAndYear(parkDateRanges),
        features: park.features.map((feature) =>
          buildFeatureOutput(feature, allDateRanges),
        ),
        parkAreas: park.parkAreas.map((parkArea) => {
          // get date ranges for park.parkArea
          // filter allDateRanges by parkArea.dateableId
          const parkAreaDateRanges = allDateRanges
            .filter((dateRange) => dateRange.dateableId === parkArea.dateableId)
            .map(buildDateRangeObject);

          // get features for park.parkArea
          // filter park.features by parkArea.id
          const parkAreaFeatures = park.features
            .filter((parkFeature) => parkFeature.parkAreaId === parkArea.id)
            .map((parkFeature) =>
              buildFeatureOutput(parkFeature, allDateRanges),
            );

          return {
            id: parkArea.id,
            dateableId: parkArea.dateableId,
            publishableId: parkArea.publishableId,
            name: parkArea.name,
            features: parkAreaFeatures,
            groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
          };
        }),
        seasons: park.seasons.map((season) => ({
          id: season.id,
          operatingYear: season.operatingYear,
          featureType: {
            id: season.publishable.featureType?.id,
            name: season.publishable.featureType?.name,
          },
          dateRanges: season.dateRanges.map(buildDateRangeObject),
        })),
        readyToPublish: park.seasons.every((season) => season.readyToPublish),
      };
    });

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
