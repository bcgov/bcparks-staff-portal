import { DateRange, DateType } from "../models/index.js";

/**
 * Detects whether the request changes any date ranges for a given date type.
 * Checks both updated/created dateRanges and deleted dateRange IDs.
 * @param {Object} params Parameters for date-range change detection
 * @param {number} params.seasonId Season ID being saved
 * @param {number} params.dateTypeNumber DateType number to check (for example OPERATION)
 * @param {Array} params.dateRanges DateRanges from the request payload
 * @param {Array<number>} params.deletedDateRangeIds DateRange IDs marked for deletion
 * @param {Transaction} params.transaction Database transaction
 * @returns {Promise<boolean>} True when matching date ranges are changed
 */
export default async function hasDateRangeChanges({
  seasonId,
  dateTypeNumber,
  dateRanges,
  deletedDateRangeIds,
  transaction,
}) {
  const dateType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber,
    },
    transaction,
  });

  if (!dateType) {
    return false;
  }

  const dateTypeId = dateType.id;

  const existingRanges = await DateRange.findAll({
    attributes: ["id", "dateTypeId", "dateableId", "startDate", "endDate"],
    where: {
      seasonId,
      dateTypeId,
    },
    transaction,
  });

  const existingById = new Map(
    existingRanges.map((range) => [range.id, range]),
  );

  // New ranges (no ID) are always a change.
  const hasCreate = (dateRanges || []).some(
    (dateRange) => !dateRange.id && dateRange.dateTypeId === dateTypeId,
  );

  if (hasCreate) {
    return true;
  }

  // Updated ranges: same ID but changed values.
  const hasUpdate = (dateRanges || []).some((dateRange) => {
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

  if (hasUpdate) {
    return true;
  }

  if (!deletedDateRangeIds?.length) {
    return false;
  }

  // Deleting an existing range is a change.
  return deletedDateRangeIds.some((id) => existingById.has(id));
}
