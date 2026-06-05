import { isWithinInterval } from "date-fns";

/**
 * Validates that the date ranges are within the operating year.
 * This rule applies to all date types except "Winter fee" dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function dateInOperatingYear(seasonData, context) {
  const { dateRanges, elements } = context;
  const { operatingYear } = seasonData.current;

  // Add errors for all invalid dates (dates must be within operatingYear)
  dateRanges.forEach((dateRange) => {
    // Skip winter dates, since they all break this rule
    if (dateRange.dateType.name === "Winter fee") return;

    // Create a date interval to check against the dates
    const minAllowedDate = new Date(operatingYear, 0, 1);
    let maxAllowedDate = new Date(operatingYear, 11, 31);
    let yearErrorMessage = `Enter dates for ${operatingYear} only`;

    // Some features can have dates that span 2 years, so adjust the max allowed date
    if (dateRange.datesCanSpan2Years) {
      maxAllowedDate = new Date(operatingYear + 1, 11, 31);
      yearErrorMessage = `Enter dates for ${operatingYear}–${operatingYear + 1} only`;
    }

    const allowedDateInterval = {
      start: minAllowedDate,
      end: maxAllowedDate,
    };

    if (
      dateRange.startDate &&
      !isWithinInterval(dateRange.startDate, allowedDateInterval)
    ) {
      context.addError(
        // Show the error below the start date field
        elements.dateField(dateRange.id || dateRange.tempId, "startDate"),
        yearErrorMessage,
      );
    }

    if (
      dateRange.endDate &&
      !isWithinInterval(dateRange.endDate, allowedDateInterval)
    ) {
      context.addError(
        // Show the error below the end date field
        elements.dateField(dateRange.id || dateRange.tempId, "endDate"),
        yearErrorMessage,
      );
    }
  });
}
