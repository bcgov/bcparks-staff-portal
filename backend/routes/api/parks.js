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
  User,
  UserAccessGroup,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import checkUserRoles from "../../utils/checkUserRoles.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";

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
      "status",
      "seasonType",
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
            attributes: ["id", "strapiDateTypeId", "name"],
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
    where: { ...where, active: true },
    required: false,
    attributes: [
      "id",
      "dateableId",
      "publishableId",
      "parkAreaId",
      "name",
      "hasBackcountryPermits",
      "hasReservations",
      "inReservationSystem",
    ],
    include: [
      {
        model: FeatureType,
        as: "featureType",
        attributes: ["id", "strapiFeatureTypeId", "name"],
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
  let validRanges = dateRanges.filter((dateRange) => dateRange.dateType);

  // filter out "Park gate open" dateType if hasGate is explicitly false at the park level
  if (hasGate === false) {
    validRanges = validRanges.filter(
      (dateRange) =>
        dateRange.dateType.strapiDateTypeId !== DATE_TYPE.PARK_GATE_OPEN,
    );
  }

  // group by dateType name
  return _.mapValues(
    _.groupBy(validRanges, (dateRange) => dateRange.dateType.name),
    (ranges) => {
      const byYear = _.groupBy(ranges, "operatingYear");

      return byYear;
    },
  );
}

// build a date range output object
function buildDateRangeObject(dateRange, operatingYear, readyToPublish) {
  return {
    id: dateRange.id,
    dateableId: dateRange.dateableId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateType: dateRange.dateType
      ? {
          id: dateRange.dateType.id,
          strapiDateTypeId: dateRange.dateType.strapiDateTypeId,
          name: dateRange.dateType.name,
        }
      : null,
    readyToPublish,
    // Add the Season's operating year for grouping
    operatingYear,
  };
}

// build a current season object
function buildCurrentSeasonOutput(seasons) {
  if (!seasons || seasons.length === 0) return { regular: null, winter: null };

  // group seasons by seasonType
  const seasonsByType = _.groupBy(seasons, "seasonType");

  // find the most recent season (highest operatingYear) for each type
  const regularSeason = seasonsByType.regular
    ? _.maxBy(seasonsByType.regular, "operatingYear")
    : null;

  const winterSeason = seasonsByType.winter
    ? _.maxBy(seasonsByType.winter, "operatingYear")
    : null;

  return {
    regular: regularSeason,
    winter: winterSeason,
  };
}

// get all date ranges from seasons
function getAllDateRanges(seasons) {
  return _.flatMap(seasons, (season) =>
    (season.dateRanges || []).map((dateRange) =>
      buildDateRangeObject(
        dateRange,
        season.operatingYear,
        season.readyToPublish,
      ),
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
        dateRanges: (plainSeason.dateRanges || [])
          .filter((dateRange) => dateRange.dateableId === feature.dateableId)
          // Remove reservation date ranges if hasReservations is false
          .filter(
            (dateRange) =>
              feature.hasReservations ||
              dateRange.dateType?.name !== "Reservation",
          ),
      };
    });

  // Temporarily disabling display of excluded types
  // @TODO: Remove this filter when Winter fee logic is revised (CMS-898)
  // @TODO: Remove this filter when FCFS logic is revised
  const excludedDateTypes = new Set(["Winter fee", "First come, first served"]);

  // get date ranges for park.feature
  const featureDateRanges = getAllDateRanges(filteredSeasons).filter(
    (dateRange) => !excludedDateTypes.has(dateRange.dateType?.name),
  );

  const output = {
    id: feature.id,
    dateableId: feature.dateableId,
    publishableId: feature.publishableId,
    parkAreaId: feature.parkAreaId,
    name: feature.name,
    hasBackcountryPermits: feature.hasBackcountryPermits,
    hasReservations: feature.hasReservations,
    inReservationSystem: feature.inReservationSystem,
    featureType: {
      id: feature.featureType.id,
      name: feature.featureType.name,
      strapiFeatureTypeId: feature.featureType.strapiFeatureTypeId,
    },
    seasons: filteredSeasons,
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };

  if (includeCurrentSeason) {
    output.currentSeason = buildCurrentSeasonOutput(feature.seasons);
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

  // get a current season
  const currentSeason = buildCurrentSeasonOutput(parkArea.seasons);

  return {
    id: parkArea.id,
    dateableId: parkArea.dateableId,
    publishableId: parkArea.publishableId,
    name: parkArea.name,
    inReservationSystem: parkArea.inReservationSystem,
    features: parkArea.features.map((feature) =>
      buildFeatureOutput(feature, parkArea.seasons, false),
    ),
    featureType: featureType ?? null,
    seasons: parkArea.seasons,
    currentSeason,
    groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Constants
    const currentYear = new Date().getFullYear();
    const hasAllParkAccess = checkUserRoles(req.auth, ["doot-all-park-access"]);

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
        seasonModel(currentYear),

        // ParkAreas
        {
          model: ParkArea,
          as: "parkAreas",
          attributes: [
            "id",
            "dateableId",
            "publishableId",
            "name",
            "inReservationSystem",
          ],
          include: [
            // Features that are part of the ParkArea
            {
              ...featureModel(currentYear),
              // Exclude parkAreas with no active features
              required: true,
            },
            // Publishable Seasons for the ParkArea
            seasonModel(currentYear),
          ],
        },

        // Publishable Features that aren't part of a ParkArea
        featureModel(currentYear, {
          parkAreaId: null,
          publishableId: {
            [Op.ne]: null,
          },
        }),

        // Filter AccessGroups on server-side based on user's access,
        // and also return accessGroup IDs for client-side bundle filters
        {
          model: AccessGroup,
          as: "accessGroups",
          attributes: ["id"],
          required: !hasAllParkAccess,
          include: hasAllParkAccess
            ? []
            : [
                {
                  model: User,
                  as: "users",
                  attributes: [],
                  where: { username: req.user?.username },
                  through: {
                    model: UserAccessGroup,
                    attributes: [],
                  },
                  required: true,
                },
              ],
        },
      ],
      order: [
        ["name", "ASC"],
        [{ model: ParkArea, as: "parkAreas" }, "name", "ASC"],
        // For Features that ARE part of a ParkArea
        [
          { model: ParkArea, as: "parkAreas" },
          { model: Feature, as: "features" },
          "name",
          "ASC",
        ],
        // For Features that ARE NOT part of a ParkArea
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
      const [regularSeasons, winterSeasons] = _.partition(
        park.seasons,
        (season) => season.seasonType === SEASON_TYPE.REGULAR,
      );
      // get date ranges for park
      const parkDateRanges = getAllDateRanges(regularSeasons);
      const parkWinterDateRanges = getAllDateRanges(winterSeasons);
      // get hasGate for park
      const parkHasGate = gateDetailMap.get(park.publishableId) ?? null;

      // get current season
      const currentSeason = buildCurrentSeasonOutput(park.seasons);

      return {
        id: park.id,
        dateableId: park.dateableId,
        publishableId: park.publishableId,
        name: park.name,
        orcs: park.orcs,
        hasGate: parkHasGate,
        hasTier1Dates: park.hasTier1Dates,
        hasTier2Dates: park.hasTier2Dates,
        hasWinterFeeDates: park.hasWinterFeeDates,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        accessGroups: park.accessGroups,
        inReservationSystem: park.inReservationSystem,
        currentSeason,
        groupedDateRanges: groupDateRangesByTypeAndYear(
          parkDateRanges,
          parkHasGate,
        ),
        winterGroupedDateRanges:
          groupDateRangesByTypeAndYear(parkWinterDateRanges),
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
          dateRanges: season.dateRanges.map((dateRange) =>
            buildDateRangeObject(
              dateRange,
              season.operatingYear,
              season.readyToPublish,
            ),
          ),
          seasonType: season.seasonType,
        })),
      };
    });

    // Return all rows
    res.json(output);
  }),
);

export default router;
