import { isBefore } from "date-fns";

/**
 * Validates that the start date is before the end date for each date range.
 * This rule applies to all date ranges that have both startDate and endDate set.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function startDateBeforeEndDate(seasonData, context) {
  const { dateRanges, elements } = context;

  // Add errors for all invalid dates (startDate >= endDate)
  dateRanges.forEach((dateRange) => {
    // Skip date ranges that aren't fully filled out yet
    if (!dateRange.startDate || !dateRange.endDate) return;

    if (!isBefore(dateRange.startDate, dateRange.endDate)) {
      context.addError(
        // Show error below the date range
        elements.dateRange(dateRange.id || dateRange.tempId),
        "Enter an end date that comes after the start date",
      );
    }
  });
}
