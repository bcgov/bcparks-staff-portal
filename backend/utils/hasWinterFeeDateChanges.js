import * as DATE_TYPE from "../constants/dateType.js";
import hasDateRangeChanges from "./hasDateRangeChanges.js";

/**
 * Detects whether the request changes any Winter fee date ranges.
 * Checks both updated/created dateRanges and deleted dateRange IDs.
 * @param {Object} params Parameters for winter-fee-date change detection
 * @param {number} params.seasonId Season ID being saved
 * @param {Array} params.dateRanges DateRanges from the request payload
 * @param {Array<number>} params.deletedDateRangeIds DateRange IDs marked for deletion
 * @param {Transaction} params.transaction Database transaction
 * @returns {Promise<boolean>} True when Winter fee dates are changed
 */
export default async function hasWinterFeeDateChanges({
  seasonId,
  dateRanges,
  deletedDateRangeIds,
  transaction,
}) {
  return hasDateRangeChanges({
    seasonId,
    dateTypeNumber: DATE_TYPE.WINTER_FEE,
    dateRanges,
    deletedDateRangeIds,
    transaction,
  });
}
