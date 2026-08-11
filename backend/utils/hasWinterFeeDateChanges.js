import * as DATE_TYPE from "../constants/dateType.js";
import { DateRange, DateType } from "../models/index.js";

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
  const winterFeeDateType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.WINTER_FEE,
    },
    transaction,
  });

  if (!winterFeeDateType) {
    return false;
  }

  const winterFeeDateTypeId = winterFeeDateType.id;

  const existingWinterFeeRanges = await DateRange.findAll({
    attributes: ["id", "dateTypeId", "dateableId", "startDate", "endDate"],
    where: {
      seasonId,
      dateTypeId: winterFeeDateTypeId,
    },
    transaction,
  });

  const existingById = new Map(
    existingWinterFeeRanges.map((range) => [range.id, range]),
  );

  // New winter fee ranges (no ID) are always a change.
  const hasWinterFeeCreate = (dateRanges || []).some(
    (dateRange) =>
      !dateRange.id && dateRange.dateTypeId === winterFeeDateTypeId,
  );

  if (hasWinterFeeCreate) {
    return true;
  }

  // Updated winter fee ranges: same ID but changed values.
  const hasWinterFeeUpdate = (dateRanges || []).some((dateRange) => {
    if (!dateRange.id) {
      return false;
    }

    const existing = existingById.get(dateRange.id);

    if (!existing) {
      return false;
    }

    const incomingStart = dateRange.startDate ?? null;
    const incomingEnd = dateRange.endDate ?? null;
    const existingStart = existing.startDate ?? null;
    const existingEnd = existing.endDate ?? null;
    const incomingDateableId = dateRange.dateableId ?? existing.dateableId;

    return (
      incomingDateableId !== existing.dateableId ||
      incomingStart !== existingStart ||
      incomingEnd !== existingEnd
    );
  });

  if (hasWinterFeeUpdate) {
    return true;
  }

  if (!deletedDateRangeIds?.length) {
    return false;
  }

  // Deleting an existing winter fee range is a change.
  return deletedDateRangeIds.some((id) => existingById.has(id));
}
