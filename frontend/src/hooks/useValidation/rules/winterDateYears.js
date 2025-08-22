import { normalizeToLocalDate } from "@/lib/utils";
import { isBefore, isWithinInterval } from "date-fns";

/**
 * Validates that the start and end dates of winter fee date ranges fall in the correct years.
 * - Start dates must be after September 30 of the operating year.
 * - End dates must be before April 1 of the next year (can be in Oct-December of the current
 *   year, but can't be later than March 31 of next year).
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function winterDateYears(seasonData, context) {
  const { dateRanges, elements } = context;
  const { current } = seasonData;

  // This rule applies to the Park level. Skip for other levels
  if (context.level !== "park") return;

  // Get a list of Park-level winter dates
  const winterDates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Winter fee" &&
      dateRange.startDate &&
      dateRange.endDate,
  );

  // Get the operating year from the current season data
  const operatingYear = current.operatingYear;

  // Check each winter date
  winterDates.forEach((winterDateRange) => {
    const startDate = normalizeToLocalDate(winterDateRange.startDate);
    const endDate = normalizeToLocalDate(winterDateRange.endDate);
    const idOrTempId = winterDateRange.id || winterDateRange.tempId;

    console.log(winterDateRange, "startDate", startDate, "endDate", endDate);

    // Start date must be October-December of the season operating year
    const validStartDates = {
      start: new Date(operatingYear, 9, 1), // October 1 of operating year
      end: new Date(operatingYear, 11, 31), // December 31 of operating year
    };

    if (!isWithinInterval(startDate, validStartDates)) {
      context.addError(
        // Show the error below the empty end date field
        elements.dateField(idOrTempId, "startDate"),
        `The start date must be after September ${operatingYear}`,
      );
    }

    // End date must be before April of the next year
    const april1 = new Date(operatingYear + 1, 3, 1);

    if (!isBefore(endDate, april1)) {
      context.addError(
        // Show the error below the empty end date field
        elements.dateField(idOrTempId, "endDate"),
        `The end date must be before April ${operatingYear + 1}`,
      );
    }
  });
}
