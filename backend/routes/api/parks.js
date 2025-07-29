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
  AccessGroup,
  GateDetail,
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
function groupDateRangesByTypeAndYear(dateRanges, hasGate = null) {
  // filter out invalid dateRanges
  let validRanges = dateRanges.filter(
    (dateRange) => dateRange.dateType && dateRange.startDate,
  );

  // filter out "Operating" dateType if hasGate is explicitly false at the park level
  if (hasGate === false) {
    validRanges = validRanges.filter(
      (dateRange) => dateRange.dateType.name !== "Operating",
    );
  }

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
function buildCurrentSeasonOutput(seasons) {
  if (!seasons || seasons.length === 0) return null;

  // find the most recent season (highest operatingYear)
  const sortedSeasons = [...seasons].sort(
    (a, b) => b.operatingYear - a.operatingYear,
  );

  return sortedSeasons[0] || null;
}

// build a previous season object
function buildPreviousSeasonOutput(seasons, currentSeason) {
  if (!seasons || seasons.length === 0 || !currentSeason) return null;

  // filter for Approved/Published seasons before current
  const previousSeasons = seasons
    .filter(
      (season) => season.operatingYear === currentSeason.operatingYear - 1,
    )
    .sort((a, b) => b.operatingYear - a.operatingYear);

  return previousSeasons[0] || null;
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
function buildFeatureOutput(feature, seasons, includeCurrentSeason = true) {
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

  // get a current and previous season
  const currentSeason = buildCurrentSeasonOutput(feature.seasons);
  const previousSeason = buildPreviousSeasonOutput(
    feature.seasons,
    currentSeason,
  );

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
    output.currentSeason = currentSeason;
    output.previousSeason = previousSeason;
  }

  return output;
}

// build park area output object
function buildParkAreaOutput(parkArea) {
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

  // get a current and previous season
  const currentSeason = buildCurrentSeasonOutput(parkArea.seasons);
  const previousSeason = buildPreviousSeasonOutput(
    parkArea.seasons,
    currentSeason,
  );

  return {
    id: parkArea.id,
    dateableId: parkArea.dateableId,
    publishableId: parkArea.publishableId,
    name: parkArea.name,
    features: parkArea.features.map((feature) =>
      buildFeatureOutput(feature, parkArea.seasons, false),
    ),
    featureType: featureType ?? null,
    seasons: parkArea.seasons,
    currentSeason,
    previousSeason,
    groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Constants
    const minYear = new Date().getFullYear();

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

        // AccessGroups
        {
          model: AccessGroup,
          as: "accessGroups",
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["name", "ASC"],
        [{ model: ParkArea, as: "parkAreas" }, "name", "ASC"],
        [{ model: Feature, as: "features" }, "name", "ASC"],
      ],
    });

    // constrain GateDetail query to only publishableIds in parks
    const publishableIds = parks.map((park) => park.publishableId);

    const allGateDetails = await GateDetail.findAll({
      attributes: ["publishableId", "hasGate"],
      where: {
        publishableId: {
          [Op.in]: publishableIds,
        },
      },
    });

    const gateDetailMap = new Map();

    allGateDetails.forEach((gate) => {
      gateDetailMap.set(gate.publishableId, gate.hasGate);
    });

    const output = parks.map((park) => {
      // get date ranges for park
      const parkDateRanges = getAllDateRanges(park.seasons);
      // get hasGate for park
      const parkHasGate = gateDetailMap.get(park.publishableId) ?? null;

      // get current and previous seasons
      const currentSeason = buildCurrentSeasonOutput(park.seasons);
      const previousSeason = buildPreviousSeasonOutput(
        park.seasons,
        currentSeason,
      );

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
        accessGroups: park.accessGroups,
        inReservationSystem: park.inReservationSystem,
        currentSeason,
        previousSeason,
        groupedDateRanges: groupDateRangesByTypeAndYear(
          parkDateRanges,
          parkHasGate,
        ),
        features: park.features.map((feature) =>
          buildFeatureOutput(feature, feature.seasons, true),
        ),
        parkAreas: park.parkAreas.map((parkArea) =>
          buildParkAreaOutput(parkArea),
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
