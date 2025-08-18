import { isWithinInterval } from "date-fns";

/**
 * Returns true if innerDateRange is completely within outerDateRange.
 * @param {DateRange} outerDateRange Outer date range with startDate and endDate
 * @param {DateRange} innerDateRange Inner date range with startDate and endDate
 * @returns {boolean} - True if innerDateRange is completely within outerDateRange
 */
export default function isDateRangeWithinDateRange(
  outerDateRange,
  innerDateRange,
) {
  return (
    // check the startDate
    isWithinInterval(innerDateRange.startDate, {
      start: outerDateRange.startDate,
      end: outerDateRange.endDate,
    }) &&
    // check the endDate
    isWithinInterval(innerDateRange.endDate, {
      start: outerDateRange.startDate,
      end: outerDateRange.endDate,
    })
  );
}
