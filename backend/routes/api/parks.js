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

// Functions
function seasonModel(minYear, required = true) {
  return {
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
    required,
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
}

function featureModel(minYear, where = {}) {
  return {
    model: Feature,
    as: "features",
    where: { ...where },
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
      // Publishable Seasons for the Feature
      seasonModel(minYear, false),
    ],
  };
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
    (ranges) => {
      const byYear = _.groupBy(ranges, (dateRange) =>
        new Date(dateRange.startDate).getFullYear(),
      );

      return byYear;
    },
  );
}

// build a date range output object
function buildDateRangeObject(dateRange, readyToPublish) {
  return {
    id: dateRange.id,
    dateableId: dateRange.dateableId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateType: dateRange.dateType
      ? {
          id: dateRange.dateType.id,
          name: dateRange.dateType.name,
        }
      : null,
    readyToPublish,
  };
}

// build a current season object
function buildCurrentSeasonOutput(seasons, currentYear) {
  if (!seasons || seasons.length === 0) return null;

  // get a season for current year
  const currentSeason = seasons.find(
    (season) => season.operatingYear === currentYear,
  );

  if (!currentSeason) return null;

  return {
    id: currentSeason.id,
    publishableId: currentSeason.publishableId,
    operatingYear: currentSeason.operatingYear,
    status: currentSeason.status,
  };
}

// get all date ranges from seasons
function getAllDateRanges(seasons) {
  return _.flatMap(seasons, (season) =>
    (season.dateRanges || []).map((dateRange) =>
      buildDateRangeObject(dateRange, season.readyToPublish),
    ),
  );
}

// build feature output object
function buildFeatureOutput(
  feature,
  seasons,
  currentYear,
  includeCurrentSeason = true,
) {
  // filter seasons if dateRange's dateableId matches feature's dateableId
  const filteredSeasons = (seasons || [])
    // first, filter seasons that have at least one matching dateRange
    .filter((season) => {
      // convert to plain object if it's a Sequelize instance
      const plainSeason =
        typeof season.toJSON === "function" ? season.toJSON() : season;

      return (plainSeason.dateRanges || []).some(
        (dateRange) => dateRange.dateableId === feature.dateableId,
      );
    })
    .map((season) => {
      // convert to plain object if it's a Sequelize instance
      const plainSeason =
        typeof season.toJSON === "function" ? season.toJSON() : season;

      return {
        ...plainSeason,
        dateRanges: (plainSeason.dateRanges || []).filter(
          (dateRange) => dateRange.dateableId === feature.dateableId,
        ),
      };
    });

  // get date ranges for park.feature
  const featureDateRanges = getAllDateRanges(filteredSeasons)
    // Temporarily disabling display of Winter Fees
    // @TODO: Remove this filter when Winter fee logic is revised (CMS-898)
    .filter((dateRange) => dateRange.dateType?.name !== "Winter fee");

  const output = {
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
    seasons: filteredSeasons,
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };

  if (includeCurrentSeason) {
    output.currentSeason = buildCurrentSeasonOutput(
      feature.seasons,
      currentYear,
    );
  }

  return output;
}

// build park area output object
function buildParkAreaOutput(parkArea, currentYear) {
  // get date ranges for parkArea
  const parkAreaDateRanges = getAllDateRanges(parkArea.seasons)
    // Temporarily disabling display of Winter Fees
    // @TODO: Remove this filter when Winter fee logic is revised (CMS-898)
    .filter((dateRange) => dateRange.dateType?.name !== "Winter fee");

  // add featureType to parkArea if all features have the same featureType
  let featureType = null;

  if (
    parkArea.features.length > 0 &&
    parkArea.features.every(
      (parkAreaFeature) =>
        parkAreaFeature.featureType &&
        parkAreaFeature.featureType.id === parkArea.features[0].featureType.id,
    )
  ) {
    featureType = parkArea.features[0].featureType.get({ plain: true });
  }

  return {
    id: parkArea.id,
    dateableId: parkArea.dateableId,
    publishableId: parkArea.publishableId,
    name: parkArea.name,
    features: parkArea.features.map((feature) =>
      buildFeatureOutput(feature, parkArea.seasons, currentYear, false),
    ),
    featureType: featureType ?? null,
    seasons: parkArea.seasons,
    currentSeason: buildCurrentSeasonOutput(parkArea.seasons, currentYear),
    groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Constants
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 1;

    const parks = await Park.findAll({
      attributes: [
        "id",
        "dateableId",
        "publishableId",
        "orcs",
        "name",
        "hasTier1Dates",
        "hasTier2Dates",
        "hasWinterFeeDates",
        "managementAreas",
        "inReservationSystem",
      ],
      include: [
        // Publishable Seasons for the Park
        seasonModel(minYear),

        // ParkAreas
        {
          model: ParkArea,
          as: "parkAreas",
          attributes: ["id", "dateableId", "publishableId", "name"],
          include: [
            // Features that are part of the ParkArea
            featureModel(minYear),
            // Publishable Seasons for the ParkArea
            seasonModel(minYear),
          ],
        },

        // Publishable Features that aren't part of a ParkArea
        featureModel(minYear, {
          parkAreaId: null,
          publishableId: {
            [Op.ne]: null,
          },
        }),
      ],
      order: [
        ["name", "ASC"],
        [{ model: ParkArea, as: "parkAreas" }, "name", "ASC"],
        [{ model: Feature, as: "features" }, "name", "ASC"],
      ],
    });

    const output = parks.map((park) => {
      // get date ranges for park
      const parkDateRanges = getAllDateRanges(park.seasons);

      return {
        id: park.id,
        dateableId: park.dateableId,
        publishableId: park.publishableId,
        name: park.name,
        orcs: park.orcs,
        hasTier1Dates: park.hasTier1Dates,
        hasTier2Dates: park.hasTier2Dates,
        hasWinterFeeDates: park.hasWinterFeeDates,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        inReservationSystem: park.inReservationSystem,
        currentSeason: buildCurrentSeasonOutput(park.seasons, currentYear),
        groupedDateRanges: groupDateRangesByTypeAndYear(parkDateRanges),
        features: park.features.map((feature) =>
          buildFeatureOutput(feature, feature.seasons, currentYear),
        ),
        parkAreas: park.parkAreas.map((parkArea) =>
          buildParkAreaOutput(parkArea, currentYear),
        ),
        seasons: park.seasons.map((season) => ({
          id: season.id,
          publishableId: season.publishableId,
          operatingYear: season.operatingYear,
          status: season.status,
          readyToPublish: season.readyToPublish,
          dateRanges: season.dateRanges.map(
            buildDateRangeObject,
            season.readyToPublish,
          ),
        })),
      };
    });

    // Return all rows
    res.json(output);
  }),
);

export default router;
