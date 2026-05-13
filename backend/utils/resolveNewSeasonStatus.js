import {
  DateRangeAnnual,
  Feature,
  Park,
  ParkArea,
  Publishable,
} from "../models/index.js";
import {
  getAllDateTypes,
  getDateTypesForFeature,
  getDateTypesForPark,
} from "./dateTypesHelpers.js";
import * as STATUS from "../constants/seasonStatus.js";
import * as DATE_TYPE from "../constants/dateType.js";

// Cache the results of getAllDateTypes
let cachedDateTypeMapsPromise = null;

/**
 * Fetches all date types and constructs lookup maps for Park- and Feature-level date types,
 * keyed by dateTypeNumber. Caches the results to prevent extra DB queries.
 * @param {Transaction|null} [transaction=null] Sequelize transaction
 * @returns {Promise<{parkDateTypesByDateTypeId: Object, featureDateTypesByDateTypeId: Object}>} An object containing two maps of date types keyed by dateTypeNumber
 */
async function getCachedDateTypeMaps(transaction = null) {
  if (!cachedDateTypeMapsPromise) {
    // Build lookup maps and populate the cache promise
    cachedDateTypeMapsPromise = getAllDateTypes({}, transaction).then(
      (allDateTypes) => ({
        // Object map of all Park-level date types by dateTypeNumber
        parkDateTypesByDateTypeId: Object.fromEntries(
          allDateTypes
            .filter((dateType) => dateType.parkLevel)
            .map((dateType) => [dateType.dateTypeNumber, dateType]),
        ),

        // Object map of all Feature-level date types by dateTypeNumber
        featureDateTypesByDateTypeId: Object.fromEntries(
          allDateTypes
            .filter((dateType) => dateType.featureLevel)
            .map((dateType) => [dateType.dateTypeNumber, dateType]),
        ),
      }),
    );
  }

  return cachedDateTypeMapsPromise;
}

/**
 * Returns the status for a new season based on its dates.
 * Returns `PENDING_REVIEW` when every DateRange for this Season is an annual date. Otherwise returns `REQUESTED`.
 * @param {number} publishableId The ID of the publishable associated with the season
 * @param {string} seasonType The type of the season from constants/seasonType
 * @param {Object} [transaction=null] Optional Sequelize transaction object for database operations
 * @returns {Promise<string>} The status for the new season from constants/seasonStatus
 */
export default async function resolveNewSeasonStatus(
  publishableId,
  seasonType,
  transaction = null,
) {
  // Get the publishable entity by its ID so we can get all associated dateable IDs
  const publishable = await Publishable.findOne({
    where: { id: publishableId },
    include: [
      {
        model: Park,
        as: "park",
        attributes: [
          "id",
          "dateableId",
          "hasTier1Dates",
          "hasTier2Dates",
          "hasWinterFeeDates",
        ],
        required: false,
      },
      {
        model: ParkArea,
        as: "parkArea",
        attributes: ["id", "dateableId"],
        required: false,
      },
      {
        model: Feature,
        as: "feature",
        attributes: [
          "id",
          "dateableId",
          "hasReservations",
          "hasBackcountryPermits",
        ],
        required: false,
      },
    ],
    transaction,
  });

  // If the publishable ID exists in the DB, one of park/parkArea/feature should be non-null
  if (!publishable) {
    throw new Error(`Publishable with ID ${publishableId} not found.`);
  }

  // Get cached date type lookup maps, keyed by dateTypeNumber
  const { parkDateTypesByDateTypeId, featureDateTypesByDateTypeId } =
    await getCachedDateTypeMaps(transaction);

  // Build set of expected dateableId + dateTypeId combinations for this Publishable
  const expectedPairs = new Set();
  const { park, parkArea, feature } = publishable;

  if (park) {
    // Get applicable date types for this Park and season type
    const dateTypes = getDateTypesForPark(
      park,
      parkDateTypesByDateTypeId,
      seasonType,
    );

    // Tier 1 / Tier 2 dates can never be annual, and always need to be reviewed
    if (
      // Return REQUESTED if the Park has Tier dates
      dateTypes.some(
        (dateType) =>
          dateType.dateTypeNumber === DATE_TYPE.TIER_1 ||
          dateType.dateTypeNumber === DATE_TYPE.TIER_2,
      )
    ) {
      return STATUS.REQUESTED;
    }

    // Add every Dateable + DateType combination to the set
    for (const dateType of dateTypes) {
      expectedPairs.add(`${park.dateableId}:${dateType.id}`);
    }
  } else if (feature) {
    // Get applicable date types for this Feature
    const dateTypes = getDateTypesForFeature(
      feature,
      featureDateTypesByDateTypeId,
    );

    // Add every Dateable + DateType combination to the set
    for (const dateType of dateTypes) {
      expectedPairs.add(`${feature.dateableId}:${dateType.id}`);
    }
  } else if (parkArea) {
    // Get all Features for this ParkArea that have dates
    const features = await Feature.findAll({
      where: { parkAreaId: parkArea.id, active: true, hasDates: true },
      attributes: ["dateableId", "hasReservations", "hasBackcountryPermits"],
      transaction,
    });

    for (const featureRow of features) {
      // Get applicable date types for this Feature
      const dateTypes = getDateTypesForFeature(
        featureRow,
        featureDateTypesByDateTypeId,
      );

      // Add every Dateable + DateType combination to the set
      for (const dateType of dateTypes) {
        expectedPairs.add(`${featureRow.dateableId}:${dateType.id}`);
      }
    }
  } else {
    throw new Error(`No entity found with publishableId ${publishableId}`);
  }

  // If no Dateables are found for this Publishable, return REQUESTED
  if (expectedPairs.size === 0) {
    return STATUS.REQUESTED;
  }

  // Fetch all DateRangeAnnual records for this publishable
  const annuals = await DateRangeAnnual.findAll({
    where: {
      publishableId,
    },
    attributes: ["dateableId", "dateTypeId", "isDateRangeAnnual"],
    transaction,
  });

  // Build a map of the DateRangeAnnual records keyed by dateableId + dateTypeId
  // to look up when we check against the expected ID pairs
  const annualByPair = new Map(
    annuals.map((annual) => [
      `${annual.dateableId}:${annual.dateTypeId}`,
      annual,
    ]),
  );

  // Check if every expected dateableId + dateTypeId combination has a corresponding DateRangeAnnual record with isDateRangeAnnual = true
  const hasCompleteAnnualCoverage = [...expectedPairs].every((pairKey) => {
    const annual = annualByPair.get(pairKey);

    return annual && annual.isDateRangeAnnual === true;
  });

  // If all dates are annual, return PENDING_REVIEW
  if (hasCompleteAnnualCoverage) return STATUS.PENDING_REVIEW;

  // Otherwise, return REQUESTED
  return STATUS.REQUESTED;
}
