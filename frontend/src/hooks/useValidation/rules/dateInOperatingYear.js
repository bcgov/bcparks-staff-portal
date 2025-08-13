import { getYear } from "date-fns";
import { normalizeToLocalDate } from "@/lib/utils";

/**
 * Validates that the date ranges are within the operating year.
 * This rule applies to all date types except "Winter fee" dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function dateInOperatingYear(seasonData, context) {
  const { dateRanges } = context;
  const { operatingYear } = seasonData.current;

  // Add errors for all invalid dates (dates must be within operatingYear)
  dateRanges.forEach((dateRange) => {
    // Skip winter dates, since they all break this rule
    if (dateRange.dateType.name === "Winter fee") return;

    // Convert UTC times to local timezone before checking values
    const localStartDate = normalizeToLocalDate(dateRange.startDate);
    const localEndDate = normalizeToLocalDate(dateRange.endDate);

    if (dateRange.startDate && getYear(localStartDate) !== operatingYear) {
      context.addError(
        // Show the error below the end date field
        `date-range-${dateRange.id || dateRange.tempId}-startDate`,
        `Enter dates for ${operatingYear} only`,
      );
    }

    if (dateRange.endDate && getYear(localEndDate) !== operatingYear) {
      context.addError(
        // Show the error below the end date field
        `date-range-${dateRange.id || dateRange.tempId}-endDate`,
        `Enter dates for ${operatingYear} only`,
      );
    }
  });
}
