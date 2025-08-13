import { areIntervalsOverlapping } from "date-fns";

/**
 * Validates that the date ranges do not overlap with previous season's dates of the same type.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function noOverlapPrevious(seasonData, context) {
  const { dateRanges } = context;
  const { previous } = seasonData;

  // This rule applies to the Feature and ParkArea level. Skip for Parks
  if (context.level === "park") return;

  // Add errors for all invalid dates
  // (dates must not overlap with previous dates of the same type)
  dateRanges.forEach((dateRange) => {
    // Skip date ranges that aren't fully filled out yet
    if (!dateRange.startDate || !dateRange.endDate) return;

    // Compare against all previous date ranges of the same type
    const overlaps = previous.some((previousDateRange) => {
      // Skip comparing if dateType and dateable don't match
      if (dateRange.dateTypeId !== previousDateRange.dateTypeId) return false;
      if (dateRange.dateableId !== previousDateRange.dateableId) return false;

      return areIntervalsOverlapping(
        {
          start: dateRange.startDate,
          end: dateRange.endDate,
        },
        {
          start: previousDateRange.startDate,
          end: previousDateRange.endDate,
        },

        // Include cases where the end of one range is the start of the other
        { inclusive: true },
      );
    });

    if (overlaps) {
      context.addError(
        // Show error below the date range
        `date-range-${dateRange.id || dateRange.tempId}`,
        "The dates must not overlap with existing dates submitted in the previous season.",
      );
    }
  });
}
