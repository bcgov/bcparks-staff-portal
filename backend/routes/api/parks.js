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

// build a season output object
function buildSeasonOutput(matchedSeason) {
  return {
    id: matchedSeason.id,
    publishableId: matchedSeason.publishableId,
    featureTypeId: matchedSeason.featureTypeId,
    status: matchedSeason.status,
    operatingYear: matchedSeason.operatingYear,
    readyToPublish: matchedSeason.readyToPublish,
  };
}

// build feature output object
function buildFeatureOutput(feature, allDateRanges, parkSeasons) {
  // get date ranges for park.feature
  // filter allDateRanges by feature.dateableId
  const featureDateRanges = allDateRanges
    .filter((dateRange) => dateRange.dateableId === feature.dateableId)
    .map(buildDateRangeObject);

  // get season for park.feature
  // filter park.seasons by feature.publishableId
  let matchedSeason = parkSeasons.find(
    (parkSeason) => parkSeason.publishableId === feature.publishableId,
  );

  // backwards compatibility
  // if matchedSeason is not found, try to match by feature.featureType.publishableId
  if (
    !matchedSeason &&
    feature.featureType &&
    feature.featureType.publishableId
  ) {
    matchedSeason = parkSeasons.find(
      (parkSeason) =>
        parkSeason.publishableId === feature.featureType.publishableId,
    );
  }

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
    season: matchedSeason ? buildSeasonOutput(matchedSeason) : null,
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
        "publishableId",
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
              attributes: ["id", "publishableId", "name"],
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
          attributes: [
            "id",
            "publishableId",
            "featureTypeId",
            "status",
            "readyToPublish",
            "operatingYear",
          ],
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
        publishableId: park.publishableId,
        name: park.name,
        orcs: park.orcs,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        inReservationSystem: park.inReservationSystem,
        status: park.status,
        groupedDateRanges: groupDateRangesByTypeAndYear(parkDateRanges),
        features: park.features.map((feature) =>
          buildFeatureOutput(feature, allDateRanges, park.seasons),
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
              buildFeatureOutput(parkFeature, allDateRanges, park.seasons),
            );

          // add featureType to parkArea if all features have the same featureType
          let featureType = null;

          if (
            parkAreaFeatures.length > 0 &&
            parkAreaFeatures.every(
              (parkAreaFeature) =>
                parkAreaFeature.featureType &&
                parkAreaFeature.featureType.id ===
                  parkAreaFeatures[0].featureType.id,
            )
          ) {
            featureType = { ...parkAreaFeatures[0].featureType };
          }

          // get season for park.parkArea
          // filter park.seasons by parkArea.publishableId
          let matchedSeason = park.seasons.find(
            (parkSeason) => parkSeason.publishableId === parkArea.publishableId,
          );

          // backwards compatibility
          // if matchedSeason is not found, try to match by parkArea.featureType.publishableId
          if (
            !matchedSeason &&
            parkArea.featureType &&
            parkArea.featureType.publishableId
          ) {
            matchedSeason = park.seasons.find(
              (parkSeason) =>
                parkSeason.publishableId === parkArea.featureType.publishableId,
            );
          }

          return {
            id: parkArea.id,
            dateableId: parkArea.dateableId,
            publishableId: parkArea.publishableId,
            name: parkArea.name,
            features: parkAreaFeatures,
            ...(featureType && { featureType }),
            season: matchedSeason ? buildSeasonOutput(matchedSeason) : null,
            groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
          };
        }),
        seasons: park.seasons.map((season) => ({
          id: season.id,
          publishableId: season.publishableId,
          operatingYear: season.operatingYear,
          status: season.status,
          featureType: {
            id: season.publishable.featureType?.id,
            name: season.publishable.featureType?.name,
          },
          readyToPublish: season.readyToPublish,
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
