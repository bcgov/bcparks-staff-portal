import { Op } from "sequelize";

import { DateRange, DateType } from "../models/index.js";
import * as DATE_TYPE from "../constants/dateType.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

/**
 * Returns the DateType filter used for a season's publishable date ranges.
 * @param {string} seasonType Season type (regular or winter)
 * @returns {Object} Sequelize where clause for DateType
 */
export function getPublishDateTypeWhere(seasonType) {
  // Winter publish only considers Winter fee dates.
  if (seasonType === SEASON_TYPE.WINTER) {
    return {
      dateTypeNumber: DATE_TYPE.WINTER_FEE,
    };
  }
  // Default case: return an empty object to not filter by dateTypeNumber.
  return {};
}

/**
 * Returns true only when all relevant DateRanges exist and each has both dates.
 * @param {Object} params Validation params
 * @param {number} params.seasonId Season ID
 * @param {Array<number>} params.dateableIds Dateable IDs that must have complete ranges
 * @param {string} params.seasonType Season type used to scope DateTypes
 * @returns {Promise<boolean>} True when complete and publishable
 */
export async function hasCompleteDateRangesForSeason({
  seasonId,
  dateableIds,
  seasonType,
}) {
  const uniqueDateableIds = [...new Set((dateableIds || []).filter(Boolean))];

  if (uniqueDateableIds.length === 0) {
    return false;
  }

  const dateRangesRows = await DateRange.findAll({
    attributes: ["dateableId", "startDate", "endDate"],
    where: {
      seasonId,
      dateableId: {
        [Op.in]: uniqueDateableIds,
      },
    },
    include: [
      {
        model: DateType,
        as: "dateType",
        attributes: ["id", "dateTypeNumber"],
        where: getPublishDateTypeWhere(seasonType),
      },
    ],
  });

  if (dateRangesRows.length === 0) {
    return false;
  }

  const foundDateableIds = new Set(dateRangesRows.map((row) => row.dateableId));

  if (foundDateableIds.size !== uniqueDateableIds.length) {
    return false;
  }

  return dateRangesRows.every((dateRange) =>
    Boolean(dateRange.startDate && dateRange.endDate),
  );
}
