import _ from "lodash";
import { Op } from "sequelize";
import * as DATE_TYPE from "../constants/dateType.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import * as FEATURE_TYPE from "../constants/featureType.js";
import {
  Season,
  DateRange,
  DateType,
  DateRangeAnnual,
  Dateable,
  Feature,
  FeatureType,
  Park,
  GateDetail,
} from "../models/index.js";
import {
  changeLogsQueryPart,
  dateableAndDatesQueryPart,
  SEASON_ATTRIBUTES,
} from "./seasonQueryHelpers.js";

/**
 * Returns the previous Season's dates for a given current Season.
 * @param {Season} currentSeason The current season object with operatingYear and publishableId
 * @param {Object} dateTypeWhere Optional where clause for filtering DateTypes
 * @returns {Array} Array with any DateRanges from the previous Season
 */
async function getPreviousSeasonDates(currentSeason, dateTypeWhere = {}) {
  try {
    // @TODO: the previous season dates here are not the same as the /park endpoint
    const prevSeason = await Season.findOne({
      where: {
        operatingYear: currentSeason.operatingYear - 1,
        publishableId: currentSeason.publishableId,
        seasonType: currentSeason.seasonType,
      },
      include: [
        {
          model: DateRange,
          as: "dateRanges",
          required: false,

          include: [
            {
              model: DateType,
              as: "dateType",
              required: false,
              attributes: ["id", "dateTypeNumber", "name"],

              // Filter DateTypes by level
              where: dateTypeWhere,
            },
          ],
        },
      ],
    });

    // If no previous season exists in the DB, return an empty array
    if (!prevSeason) return [];

    return prevSeason.dateRanges;
  } catch (error) {
    console.error("Error fetching previous season:", error);
    throw error;
  }
}

/**
 * Returns all DateRangeAnnuals for a given publishableId.
 * @param {number} publishableId The ID of the Publishable to get DateRange
 * @returns {Promise<Array>} An array of DateRangeAnnual models with their DateType
 */
async function getDateRangeAnnuals(publishableId) {
  if (!publishableId) return [];
  return await DateRangeAnnual.findAll({
    where: { publishableId },
    attributes: ["id", "dateableId", "isDateRangeAnnual"],
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "dateTypeNumber", "name"],
      },
    ],
  });
}

/**
 * Returns all GateDetails for a given publishableId.
 * @param {number} publishableId The ID of the Publishable to get GateDetail
 * @returns {Promise<Object|null>} GateDetail model, or null if not found
 */
async function getGateDetail(publishableId) {
  if (!publishableId) return null;
  return await GateDetail.findOne({
    where: { publishableId },
    attributes: [
      "id",
      "hasGate",
      "gateOpenTime",
      "gateCloseTime",
      "gateOpensAtDawn",
      "gateClosesAtDusk",
    ],
  });
}

/**
 * Returns all Frontcountry Campground feature reservation dates for a park and operating year.
 * @param {Object} park Park model with features and parkAreas
 * @param {number} operatingYear Operating year for the Seasons
 * @returns {Promise<Array>} - Array of Frontcountry Campground feature reservation dates
 */
async function getFrontcountryFeatureReservationDates(park, operatingYear) {
  // Only fetch dates if the park has Winter fee dates or either Tier 1 or Tier 2 dates.
  // This data is needed for Winter/Tier date validation.
  if (!(park.hasWinterFeeDates || park.hasTier1Dates || park.hasTier2Dates))
    return [];

  const featurePublishableIds = park.features
    // Filter out any park features without Publishable IDs
    .filter((feature) => feature.publishableId)
    .map((feature) => feature.publishableId);

  const areaFeaturePublishableIds = park.parkAreas
    // Filter out any park areas without Publishable IDs
    .filter((parkArea) => parkArea.publishableId)
    .map((parkArea) => parkArea.publishableId);

  // Query the Season IDs for each publishable Feature in the Park,
  // so we can look up their DateRanges
  const featureSeasons = await Season.findAll({
    attributes: ["id"],

    where: {
      operatingYear,

      publishableId: {
        [Op.in]: [...featurePublishableIds, ...areaFeaturePublishableIds],
      },
    },
  });

  const featureSeasonIds = featureSeasons.map((season) => season.id);

  // Get all Frontcountry Campground Reservation DateRanges for these Seasons
  return DateRange.findAll({
    attributes: ["id", "startDate", "endDate", "dateTypeId", "seasonId"],
    where: {
      seasonId: {
        [Op.in]: featureSeasonIds,
      },

      // Filter out blank date ranges (null startDate and endDate)
      startDate: {
        [Op.ne]: null,
      },
      endDate: {
        [Op.ne]: null,
      },
    },

    include: [
      // Only include DateRanges with the Reservation DateType
      {
        model: DateType,
        as: "dateType",
        attributes: ["id"],
        where: {
          dateTypeNumber: DATE_TYPE.RESERVATION,
        },
        required: true,
      },

      // Only include DateRanges that are associated with a Frontcountry Campground feature
      {
        model: Dateable,
        as: "dateable",
        attributes: ["id"],
        required: true,
        include: [
          {
            model: Feature,
            as: "feature",
            required: true,
            attributes: ["id"],
            include: [
              {
                model: FeatureType,
                as: "featureType",
                attributes: ["id"],
                where: {
                  featureTypeNumber: FEATURE_TYPE.FRONTCOUNTRY_CAMPGROUND,
                },
                required: true,
              },
            ],
          },
        ],
      },
    ],
  });
}

/**
 * Returns Tier 1, Tier 2, and Winter fee dates for a Park operating year.
 * @param {Object} park Park model with hasTier1Dates, hasTier2Dates, and publishableId
 * @param {number} operatingYear Operating year for the Seasons
 * @returns {Promise<Object>} - Object with parkTier1Dates, parkTier2Dates, and parkWinterDates arrays
 */
async function getParkDates(park, operatingYear) {
  // Query both regular and winter seasons to get the Tier 1, Tier 2, and Winter fee dates
  // for this park and year
  const seasons = await Season.findAll({
    where: {
      publishableId: park.publishableId,
      operatingYear,
      seasonType: [SEASON_TYPE.REGULAR, SEASON_TYPE.WINTER],
    },

    include: [
      {
        model: DateRange,
        as: "dateRanges",
        required: false,

        include: [
          {
            model: DateType,
            as: "dateType",
            attributes: ["id", "dateTypeNumber", "name"],
          },
        ],
      },
    ],
  });

  // Merge all dateRanges from both seasons
  const allRanges = seasons.flatMap((season) =>
    (season.dateRanges || []).filter(
      (range) => range.startDate && range.endDate,
    ),
  );

  // Group by dateTypeNumber
  const datesByStrapiId = _.groupBy(
    allRanges,
    (range) => range.dateType?.dateTypeNumber,
  );

  // Use constants for Tier 1, Tier 2, and Winter fee
  const tier1Dates = datesByStrapiId[DATE_TYPE.TIER_1] || [];
  const tier2Dates = datesByStrapiId[DATE_TYPE.TIER_2] || [];
  const parkWinterDates = datesByStrapiId[DATE_TYPE.WINTER_FEE] || [];

  // Only include tier dates if park supports them
  const parkTier1Dates = park.hasTier1Dates ? tier1Dates : [];
  const parkTier2Dates = park.hasTier2Dates ? tier2Dates : [];

  return {
    parkTier1Dates,
    parkTier2Dates,
    parkWinterDates,
  };
}

/**
 * Returns the winter season for a park if it has winter fee dates enabled.
 * @param {Object} park Park model with hasWinterFeeDates and publishableId
 * @param {number} operatingYear Operating year for the Seasons
 * @returns {Promise<Object|null>} The winter season object with all related data, or null
 */
async function getWinterSeason(park, operatingYear) {
  if (!park.hasWinterFeeDates) {
    return null;
  }

  // Find the winter season ID
  const winterSeasonLookup = await Season.findOne({
    attributes: ["id"],
    where: {
      publishableId: park.publishableId,
      operatingYear,
      seasonType: SEASON_TYPE.WINTER,
    },
  });

  if (!winterSeasonLookup) {
    return null;
  }

  const winterSeason = await Season.findByPk(winterSeasonLookup.id, {
    attributes: SEASON_ATTRIBUTES,
    include: [
      {
        model: Park,
        as: "park",
        include: [
          // Park-level dates for this winter season
          dateableAndDatesQueryPart(winterSeasonLookup.id),
        ],
      },

      changeLogsQueryPart(),
    ],
  });

  if (!winterSeason) {
    return null;
  }

  // Get DateRangeAnnuals and GateDetail for winter season
  const dateRangeAnnuals = await getDateRangeAnnuals(
    winterSeason.publishableId,
  );

  return {
    ...winterSeason.toJSON(),
    dateRangeAnnuals,
  };
}

export {
  getPreviousSeasonDates,
  getDateRangeAnnuals,
  getGateDetail,
  getFrontcountryFeatureReservationDates,
  getParkDates,
  getWinterSeason,
};
