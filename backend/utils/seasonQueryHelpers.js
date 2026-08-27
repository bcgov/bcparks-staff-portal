import { Op } from "sequelize";
import {
  SeasonChangeLog,
  DateRange,
  DateType,
  Dateable,
  FeatureType,
  User,
} from "../models/index.js";

/**
 * Returns a query part for including change logs associated with a Season.
 * @returns {Object} Sequelize query part for fetching change logs
 */
export function changeLogsQueryPart() {
  return {
    model: SeasonChangeLog,
    as: "changeLogs",
    attributes: ["id", "notes", "createdAt"],
    // Filter out empty notes
    where: {
      notes: {
        [Op.ne]: "",
      },
    },
    required: false,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name"],
      },
    ],
  };
}

/**
 * Returns a query part for including DateRanges associated with a Season.
 * @param {number} seasonId the ID of the DateRanges' Season
 * @returns {Object} Sequelize query part for fetching DateRanges
 */
export function dateRangesQueryPart(seasonId) {
  return {
    model: DateRange,
    as: "dateRanges",
    attributes: ["id", "startDate", "endDate", "dateTypeId", "dateableId"],
    where: {
      seasonId,
    },
    required: false,
    order: [["startDate", "ASC"]], // @TODO: This doesn't work?
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "dateTypeNumber", "name"],
      },
    ],
  };
}

/**
 * Returns a query part for including a Dateable and its DateRanges.
 * @param {number} seasonId the ID of the DateRanges' Season
 * @returns {Object} Sequelize query part for fetching Dateable and its DateRanges
 */
export function dateableAndDatesQueryPart(seasonId) {
  return {
    model: Dateable,
    as: "dateable",
    include: [dateRangesQueryPart(seasonId)],
  };
}

/**
 * Returns a query part for including FeatureType details with a Feature.
 * @returns {Object} Sequelize query part for fetching FeatureType details
 */
export function featureTypeQueryPart() {
  return {
    model: FeatureType,
    as: "featureType",
    attributes: ["id", "name", "icon", "featureTypeNumber"],
  };
}

// Common attributes for all Season queries
export const SEASON_ATTRIBUTES = [
  "id",
  "operatingYear",
  "status",
  "informationSvcApproved",
  "reservationSvcApproved",
  "readyToPublish",
  "editable",
  "publishableId",
  "seasonType",
  "savedWithErrors",
  "updatedAt",
];
