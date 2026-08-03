import { Op, col, where as sqlWhere } from "sequelize";
import { Router } from "express";
import _ from "lodash";
import sequelize from "../../db/connection.js";
import {
  Park,
  Season,
  FeatureType,
  ParkAreaType,
  DateRange,
  DateType,
  Feature,
  ParkArea,
  AccessGroup,
  GateDetail,
  User,
  UserAccessGroup,
  SeasonChangeLog,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import checkUserRoles, {
  getRolesFromAuth,
} from "../../utils/checkUserRoles.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as USER_ROLES from "../../constants/userRoles.js";

// Constants
const router = Router();

// Functions

/**
 * Builds Sequelize include configuration for Season model with date ranges.
 * @param {number} minYear Minimum operating year to filter seasons by (inclusive)
 * @param {boolean} [required=true] Whether seasons are required in the join
 * @param {string|null} [seasonStatus=null] Optional status filter (e.g., 'published')
 * @returns {Object} Sequelize include config for Season model with nested DateRanges
 */
function seasonModel(minYear, required = true, seasonStatus = null) {
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
      "savedWithErrors",
    ],
    // filter seasons with operatingYear >= minYear
    where: {
      operatingYear: {
        [Op.gte]: minYear,
      },
      ...(seasonStatus ? { status: seasonStatus } : {}),
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
            attributes: ["id", "dateTypeNumber", "name"],
          },
        ],
      },
    ],
  };
}

/**
 * Builds Season include config for Feature relations.
 * Excludes winter seasons when the parent Feature hasWinterFeeDates is false.
 * @param {number} minYear Minimum operating year to filter seasons by (inclusive)
 * @param {string|null} [seasonStatus=null] Optional status filter
 * @returns {Object} Sequelize include config for Feature -> Season
 */
function featureSeasonModel(minYear, seasonStatus = null) {
  return {
    ...seasonModel(minYear, false, seasonStatus),
    where: {
      operatingYear: {
        [Op.gte]: minYear,
      },
      ...(seasonStatus ? { status: seasonStatus } : {}),
      // SQL-level guard: if a feature has no winter fee dates, exclude winter seasons.
      [Op.or]: [
        { seasonType: { [Op.ne]: SEASON_TYPE.WINTER } },
        sqlWhere(col("features.hasWinterFeeDates"), true),
      ],
    },
  };
}

/**
 * Builds Sequelize include configuration for Feature model with type and seasons.
 * @param {number} minYear Minimum operating year to filter seasons by (inclusive)
 * @param {Object} [where={}] Additional Sequelize WHERE conditions for features
 * @param {string|null} [seasonStatus=null] Optional season status filter
 * @returns {Object} Sequelize include config for Feature model with FeatureType and Seasons
 */
function featureModel(minYear, where = {}, seasonStatus = null) {
  return {
    model: Feature,
    as: "features",
    where: { ...where, active: true, hasDates: true },
    required: false,
    attributes: [
      "id",
      "dateableId",
      "publishableId",
      "parkAreaId",
      "name",
      "hasBackcountryPermits",
      "hasReservations",
      "hasWinterFeeDates",
      "inReservationSystem",
      "datesCanSpan2Years",
    ],
    include: [
      {
        model: FeatureType,
        as: "featureType",
        required: true,
        attributes: ["id", "featureTypeNumber", "name"],
      },
      // Publishable Seasons for the Feature
      featureSeasonModel(minYear, seasonStatus),
    ],
  };
}

/**
 * Groups date ranges hierarchically by type name and year.
 * Optionally filters out PARK_GATE_OPEN type if hasGate is false.
 * @param {Array<Object>} dateRanges Array of date range objects with dateType
 * @param {boolean|null} [hasGate=null] If false, filter out PARK_GATE_OPEN type
 * @returns {Object} Nested map: {dateTypeName: {year: [ranges]}}
 * @example
 * {"Operation": {2024: [...], 2025: [...]}, "Winter": {2024: [...]}}
 *
 */
function groupDateRangesByTypeAndYear(dateRanges, hasGate = null) {
  // filter out invalid dateRanges
  let validRanges = dateRanges.filter((dateRange) => dateRange.dateType);

  // filter out "Park gate open" dateType if hasGate is explicitly false at the park level
  if (hasGate === false) {
    validRanges = validRanges.filter(
      (dateRange) =>
        dateRange.dateType.dateTypeNumber !== DATE_TYPE.PARK_GATE_OPEN,
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

/**
 * Creates standardized date range output object.
 * @param {Object} dateRange Raw date range from database
 * @param {number} operatingYear Operating year for context
 * @param {boolean} readyToPublish Whether the season is ready to publish
 * @returns {Object} Formatted date range with id, dates, type, and year
 */
function buildDateRangeObject(dateRange, operatingYear, readyToPublish) {
  return {
    id: dateRange.id,
    dateableId: dateRange.dateableId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateType: dateRange.dateType
      ? {
          id: dateRange.dateType.id,
          dateTypeNumber: dateRange.dateType.dateTypeNumber,
          name: dateRange.dateType.name,
        }
      : null,
    readyToPublish,
    // Add the Season's operating year for grouping
    operatingYear,
  };
}

/**
 * Returns the ID of the most recent season (highest operatingYear) per seasonType.
 * @param {Array<Object>} seasons Array of season objects
 * @returns {Array<number>} Array of current season IDs
 */
function getCurrentSeasonIds(seasons) {
  return Object.values(_.groupBy(seasons, "seasonType"))
    .map((group) => _.maxBy(group, "operatingYear")?.id)
    .filter(Boolean);
}

/**
 * Extracts most recent season for each season type (REGULAR and WINTER).
 * @param {Array<Object>|null} seasons Array of season objects
 * @returns {Object} {regular: season|null, winter: season|null} - Most recent of each type
 */
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

/**
 * Flattens nested season.dateRanges into single array with season context.
 * @param {Array<Object>} seasons Array of season objects containing dateRanges
 * @returns {Array<Object>} Flattened array of standardized date range objects
 */
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

/**
 * Converts Sequelize instance to plain JavaScript object.
 * @param {Object} season Sequelize instance or plain object
 * @returns {Object} Plain JavaScript object
 */
function getPlainSeason(season) {
  return typeof season.toJSON === "function" ? season.toJSON() : season;
}

/**
 * Queries SeasonChangeLogs table to check for non-empty notes and returns a lookup map.
 * @param {Array<number>} seasonIds Array of season IDs to check
 * @returns {Promise<Map<number, boolean>>} Map of seasonId -> hasNotes (boolean)
 */
async function fetchAndMapSeasonNotes(seasonIds) {
  if (seasonIds.length === 0) {
    return new Map();
  }

  // Query the SeasonChangeLogs table for the given season IDs to check for notes
  const notesResult = await sequelize.query(
    `SELECT DISTINCT "s"."id" as "seasonId",
      EXISTS(
        SELECT 1 FROM "SeasonChangeLogs" scl
        WHERE scl."seasonId" = s."id" AND TRIM(scl."notes") != ''
      ) as "hasNotes"
    FROM "Seasons" s
    WHERE s."id" IN (${seasonIds.map(() => "?").join(",")})`,
    {
      replacements: seasonIds,
      type: sequelize.QueryTypes.SELECT,
    },
  );

  const seasonNotesMap = new Map();

  notesResult.forEach((row) => {
    seasonNotesMap.set(row.seasonId, row.hasNotes);
  });

  return seasonNotesMap;
}

/**
 * Formats feature output with filtered seasons and optional currentSeason.
 * @param {Object} feature Feature instance with id, dateableId, seasons, etc.
 * @param {Array<Object>} seasons Parent seasons array to filter from
 * @param {boolean} [includeCurrentSeason=true] Whether to include computed currentSeason
 * @returns {Object} Formatted feature with id, name, seasons, groupedDateRanges, etc.
 */
function buildFeatureOutput(feature, seasons, includeCurrentSeason = true) {
  // filter seasons if dateRange's dateableId matches feature's dateableId
  const filteredSeasons = (seasons || [])
    // first, filter seasons that have at least one matching dateRange
    .filter((season) =>
      (getPlainSeason(season).dateRanges || []).some(
        (dateRange) => dateRange.dateableId === feature.dateableId,
      ),
    )
    .map((season) => {
      const plainSeason = getPlainSeason(season);

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
  // @TODO: Remove this filter when FCFS logic is revised
  const excludedDateTypes = new Set([DATE_TYPE.FIRST_COME_FIRST_SERVED]);

  // get date ranges for park.feature
  const featureDateRanges = getAllDateRanges(filteredSeasons).filter(
    (dateRange) => !excludedDateTypes.has(dateRange.dateType?.dateTypeNumber),
  );

  const output = {
    id: feature.id,
    dateableId: feature.dateableId,
    publishableId: feature.publishableId,
    parkAreaId: feature.parkAreaId,
    name: feature.name,
    hasBackcountryPermits: feature.hasBackcountryPermits,
    hasReservations: feature.hasReservations,
    hasWinterFeeDates: feature.hasWinterFeeDates,
    inReservationSystem: feature.inReservationSystem,
    datesCanSpan2Years: feature.datesCanSpan2Years,
    featureType: {
      id: feature.featureType.id,
      name: feature.featureType.name,
      featureTypeNumber: feature.featureType.featureTypeNumber,
    },
    seasons: filteredSeasons,
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };

  if (includeCurrentSeason) {
    const currentSeason = buildCurrentSeasonOutput(feature.seasons);

    // Convert current season objects to plain objects (metadata will be added later)
    if (currentSeason.regular) {
      currentSeason.regular = getPlainSeason(currentSeason.regular);
    }
    if (currentSeason.winter) {
      currentSeason.winter = getPlainSeason(currentSeason.winter);
    }
    output.currentSeason = currentSeason;
  }

  return output;
}

/**
 * Adds hasNotes and lastUpdated metadata to current seasons.
 * Returns the parks array with metadata added to season objects at all levels.
 * @param {Array<Object>} parks Array of park objects with seasons, parkAreas, features
 * @param {Set<number>} currentSeasonIds Set of current season IDs to update
 * @param {Map<number, boolean>} seasonNotesMap seasonId -> hasNotes lookup
 * @param {Map<number, Object>} lastUpdatedMap seasonId -> lastUpdated lookup
 * @returns {Array<Object>} Parks array with metadata added to current seasons
 */
function addSeasonChangelogMetadata(
  parks,
  currentSeasonIds,
  seasonNotesMap,
  lastUpdatedMap,
) {
  // Adds hasNotes and lastUpdated metadata to a season object if it is a current season.
  function addMetadataToSeason(season) {
    if (currentSeasonIds.has(season.id)) {
      season.hasNotes = !!seasonNotesMap.get(season.id);
      season.lastUpdated = lastUpdatedMap.get(season.id) ?? null;
    }
  }

  parks.forEach((park) => {
    // Park-level seasons
    park.seasons.forEach(addMetadataToSeason);

    // ParkArea-level seasons
    park.parkAreas.forEach((parkArea) => {
      // ParkArea-level currentSeason
      if (parkArea.currentSeason?.regular)
        addMetadataToSeason(parkArea.currentSeason.regular);
      if (parkArea.currentSeason?.winter)
        addMetadataToSeason(parkArea.currentSeason.winter);
    });

    // Features (not part of a parkArea)
    park.features.forEach((feature) => {
      // Feature-level currentSeason
      if (feature.currentSeason?.regular)
        addMetadataToSeason(feature.currentSeason.regular);
      if (feature.currentSeason?.winter)
        addMetadataToSeason(feature.currentSeason.winter);
    });
  });

  return parks;
}

/**
 * Formats park area output with features, seasons, and metadata.
 * Adds hasNotes and lastUpdated from the provided maps.
 * @param {Object} parkArea ParkArea instance with seasons, features, parkAreaType
 * @param {Map<number, boolean>} seasonNotesMap seasonId -> hasNotes lookup map
 * @param {Map<number, Object>} [lastUpdatedMap=new Map()] seasonId -> lastUpdated lookup map
 * @returns {Object} Formatted park area with id, name, features, seasons, currentSeason, etc.
 */
function buildParkAreaOutput(
  parkArea,
  seasonNotesMap,
  lastUpdatedMap = new Map(),
) {
  // get date ranges for parkArea
  const parkAreaDateRanges = getAllDateRanges(parkArea.seasons);

  // Get a distinct list of feature types in the park area for filtering purposes
  const featureTypes = _.uniqBy(
    parkArea.features.map((feature) => feature.featureType),
    "id",
  );

  // get a current season
  const currentSeason = buildCurrentSeasonOutput(parkArea.seasons);

  // Convert current season objects to plain objects (metadata will be added later)
  if (currentSeason.regular) {
    currentSeason.regular = getPlainSeason(currentSeason.regular);
  }
  if (currentSeason.winter) {
    currentSeason.winter = getPlainSeason(currentSeason.winter);
  }

  return {
    id: parkArea.id,
    dateableId: parkArea.dateableId,
    publishableId: parkArea.publishableId,
    name: parkArea.name,
    inReservationSystem: parkArea.inReservationSystem,
    hasWinterFeeDates: parkArea.hasWinterFeeDates,
    features: parkArea.features.map((feature) =>
      buildFeatureOutput(
        feature,
        parkArea.seasons,
        false,
        seasonNotesMap,
        lastUpdatedMap,
      ),
    ),
    featureTypes,
    parkAreaType: parkArea.parkAreaType,
    // Build parkArea seasons array without metadata. Metadata (hasNotes, lastUpdated)
    // will be added in `addSeasonChangelogMetadata` for current seasons only.
    seasons: parkArea.seasons.map((season) => getPlainSeason(season)),
    currentSeason,
    groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    // Constants
    const currentYear = new Date().getFullYear();
    const requestedOperatingYear = Number.parseInt(req.query.operatingYear, 10);
    const minAllowedOperatingYear = currentYear - 1;

    // Default to the previous operating year so the response includes both the prior and current seasons.
    // If an operatingYear is explicitly requested, clamp to a safe lower bound.
    const operatingYear = Number.isNaN(requestedOperatingYear)
      ? minAllowedOperatingYear
      : Math.max(requestedOperatingYear, minAllowedOperatingYear);
    const seasonStatus =
      typeof req.query.seasonStatus === "string"
        ? req.query.seasonStatus
        : null;
    const hasAllParkAccess = checkUserRoles(getRolesFromAuth(req.auth), [
      USER_ROLES.ALL_PARK_ACCESS,
    ]);

    // Main query: Fetch Parks with their Seasons
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
      where: { hasDates: true },
      include: [
        // Publishable Seasons for the Park
        seasonModel(operatingYear, true, seasonStatus),

        // Publishable Features that aren't part of a ParkArea
        featureModel(
          operatingYear,
          {
            parkAreaId: null,
            publishableId: {
              [Op.ne]: null,
            },
          },
          seasonStatus,
        ),
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
        // For Features that ARE NOT part of a ParkArea
        [{ model: Feature, as: "features" }, "name", "ASC"],
      ],
    });

    const parkIds = parks.map((park) => park.id);
    const publishableIds = parks.map((park) => park.publishableId);

    // Query 2: Fetch ParkAreas with their Features and Seasons for the Parks in the main query
    const parkAreasQuery = ParkArea.findAll({
      attributes: [
        "id",
        "dateableId",
        "publishableId",
        "parkId",
        "name",
        "inReservationSystem",
        "hasWinterFeeDates",
      ],
      where: { parkId: parkIds },
      include: [
        // Features that are part of the ParkArea
        {
          ...featureModel(operatingYear, {}, seasonStatus),
          // Exclude parkAreas with no active features
          required: true,
        },
        // Publishable Seasons for the ParkArea
        featureSeasonModel(operatingYear, seasonStatus),
        // ParkAreaType for the ParkArea
        {
          model: ParkAreaType,
          as: "parkAreaType",
          attributes: ["id", "parkAreaTypeNumber", "name"],
          required: true,
        },
      ],
      order: [
        ["name", "ASC"],
        // For Features that ARE part of a ParkArea
        [
          { model: Feature, as: "features" },
          { model: FeatureType, as: "featureType" },
          "rank",
          "ASC",
        ],
        [{ model: Feature, as: "features" }, "name", "ASC"],
      ],
    });

    // Query 3: Fetch GateDetails for the Parks in the main query
    const gateDetailsQuery = GateDetail.findAll({
      attributes: ["publishableId", "hasGate"],
      where: {
        publishableId: {
          [Op.in]: publishableIds,
        },
      },
    });

    // Fetch ParkAreas and GateDetails in parallel
    const [parkAreas, allGateDetails] = await Promise.all([
      parkAreasQuery,
      gateDetailsQuery,
    ]);

    // Merge ParkAreas back into the main query results by parkId
    const parkAreasByParkId = _.groupBy(parkAreas, "parkId");

    parks.forEach((park) => {
      park.parkAreas = parkAreasByParkId[park.id] || [];
    });

    // Compute current season IDs across all levels (parks, parkAreas, and their features)
    // so lastUpdated can be populated for every current season in the response.
    // parkAreas must be fetched before this can run.
    // "Current season" is the highest operatingYear per seasonType.
    const currentSeasonIds = new Set([
      // Park-level current seasons
      ...parks.flatMap((park) => getCurrentSeasonIds(park.seasons)),

      // Park Feature current seasons
      ...parks.flatMap((park) =>
        park.features.flatMap((feature) =>
          getCurrentSeasonIds(feature.seasons),
        ),
      ),

      // ParkArea current seasons
      ...parkAreas.flatMap((parkArea) => getCurrentSeasonIds(parkArea.seasons)),

      // ParkArea Feature current seasons
      ...parkAreas.flatMap((parkArea) =>
        parkArea.features.flatMap((feature) =>
          getCurrentSeasonIds(feature.seasons),
        ),
      ),
    ]);

    // Query 4: Fetch season notes for current seasons only
    const seasonNotesQuery = fetchAndMapSeasonNotes(
      Array.from(currentSeasonIds),
    );

    // Query 5: Fetch last updated info for current seasons (if any)
    const lastUpdatedQuery =
      currentSeasonIds.size > 0
        ? SeasonChangeLog.findAll({
            attributes: ["id", "seasonId", "createdAt"],
            where: {
              seasonId: { [Op.in]: [...currentSeasonIds] },
            },
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
                required: false,
              },
            ],
            order: [
              ["seasonId", "ASC"],
              ["createdAt", "DESC"],
            ],
          })
        : Promise.resolve([]);

    // Fetch season notes and last updated info in parallel
    const [seasonNotesMap, lastUpdatedResult] = await Promise.all([
      seasonNotesQuery,
      lastUpdatedQuery,
    ]);

    // Build lookup map for GateDetails by publishableId
    const gateDetailMap = new Map();

    allGateDetails.forEach((gate) => {
      gateDetailMap.set(gate.publishableId, gate.hasGate);
    });

    // Build lookup map for lastUpdated by seasonId
    // Take only first result per seasonId (most recent due to sorting in query)
    const lastUpdatedMap = new Map();

    lastUpdatedResult.forEach((row) => {
      if (!lastUpdatedMap.has(row.seasonId)) {
        lastUpdatedMap.set(row.seasonId, {
          createdAt: row.createdAt,
          createdBy: row.user?.name ?? "Unknown",
        });
      }
    });

    let output = parks.map((park) => {
      const [regularSeasons, winterSeasons] = _.partition(
        park.seasons,
        (season) => season.seasonType === SEASON_TYPE.REGULAR,
      );
      // Get date ranges for park
      // For regular seasons, exclude Winter fee dates
      const parkDateRanges = getAllDateRanges(regularSeasons).filter(
        (dateRange) =>
          dateRange.dateType?.dateTypeNumber !== DATE_TYPE.WINTER_FEE,
      );
      // For winter seasons, only include Winter fee dates
      const parkWinterDateRanges = getAllDateRanges(winterSeasons).filter(
        (dateRange) =>
          dateRange.dateType?.dateTypeNumber === DATE_TYPE.WINTER_FEE,
      );
      // Get hasGate for park
      const parkHasGate = gateDetailMap.get(park.publishableId) ?? null;

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
        inReservationSystem: park.inReservationSystem,
        groupedDateRanges: groupDateRangesByTypeAndYear(
          parkDateRanges,
          parkHasGate,
        ),
        winterGroupedDateRanges:
          groupDateRangesByTypeAndYear(parkWinterDateRanges),
        features: park.features.map((feature) =>
          buildFeatureOutput(
            feature,
            feature.seasons,
            true,
            seasonNotesMap,
            lastUpdatedMap,
          ),
        ),
        parkAreas: park.parkAreas.map((parkArea) =>
          buildParkAreaOutput(parkArea, seasonNotesMap, lastUpdatedMap),
        ),
        // Build park-level seasons array with all seasons. Metadata (hasNotes, lastUpdated)
        // will be added in post-processing for current seasons only.
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

    output = addSeasonChangelogMetadata(
      output,
      currentSeasonIds,
      seasonNotesMap,
      lastUpdatedMap,
    );

    res.json(output);
  }),
);

// GET /parks/metadata
// Returns supplemental park data needed for table filtering.
// Separated from main `/parks` payload so data can be lazy-loaded.
// Frontend merges this into parks array by park id once resolved, then enables filters.
router.get(
  "/metadata",
  asyncHandler(async (req, res) => {
    const hasAllParkAccess = checkUserRoles(getRolesFromAuth(req.auth), [
      USER_ROLES.ALL_PARK_ACCESS,
    ]);

    const parks = await Park.findAll({
      attributes: ["id", "managementAreas"],
      where: { hasDates: true },
      include: [
        {
          model: AccessGroup,
          as: "accessGroups",
          attributes: ["id"],
          through: {
            attributes: [],
          },
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
    });

    const output = parks.map((park) => ({
      id: park.id,
      section: park.managementAreas.map((area) => area.section),
      managementArea: park.managementAreas.map((area) => area.mgmtArea),
      accessGroups: park.accessGroups,
    }));

    res.json(output);
  }),
);

export default router;
