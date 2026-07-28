import * as DATE_TYPE from "../constants/dateType.js";
import { DateRange, DateType } from "../models/index.js";

/**
 * Detects whether the request changes any Operation date ranges.
 * Checks both updated/created dateRanges and deleted dateRange IDs.
 * @param {Object} params Parameters for operation-date change detection
 * @param {number} params.seasonId Season ID being saved
 * @param {Array} params.dateRanges DateRanges from the request payload
 * @param {Array<number>} params.deletedDateRangeIds DateRange IDs marked for deletion
 * @param {Transaction} params.transaction Database transaction
 * @returns {Promise<boolean>} True when Operation dates are changed
 */
export default async function hasOperationDateChanges({
  seasonId,
  dateRanges,
  deletedDateRangeIds,
  transaction,
}) {
  const operationDateType = await DateType.findOne({
    attributes: ["id"],
    where: {
      dateTypeNumber: DATE_TYPE.OPERATION,
    },
    transaction,
  });

  if (!operationDateType) {
    return false;
  }

  const operationDateTypeId = operationDateType.id;

  const existingOperationRanges = await DateRange.findAll({
    attributes: ["id", "dateTypeId", "dateableId", "startDate", "endDate"],
    where: {
      seasonId,
      dateTypeId: operationDateTypeId,
    },
    transaction,
  });

  const existingById = new Map(
    existingOperationRanges.map((range) => [range.id, range]),
  );

  // New operation ranges (no ID) are always a change.
  const hasOperationCreate = (dateRanges || []).some(
    (dateRange) =>
      !dateRange.id && dateRange.dateTypeId === operationDateTypeId,
  );

  if (hasOperationCreate) {
    return true;
  }

  // Updated operation ranges: same ID but changed values.
  const hasOperationUpdate = (dateRanges || []).some((dateRange) => {
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

  if (hasOperationUpdate) {
    return true;
  }

  if (!deletedDateRangeIds?.length) {
    return false;
  }

  // Deleting an existing operation range is a change.
  return deletedDateRangeIds.some((id) => existingById.has(id));
}
