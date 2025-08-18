import isDateTypeOptional from "@/lib/isDateTypeOptional";

/**
 * Validates that the date ranges are provided for required date types.
 * This rule applies to all date types except those that are optional based on the dateType and level.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function requiredDateRanges(seasonData, context) {
  const { elements, level } = context;

  // Only validate after the form is submitted
  if (!context.submitted) return;

  const { dateRanges } = context;

  // Filter out date ranges with optional date types
  const requiredRanges = dateRanges.filter(
    (dateRange) => !isDateTypeOptional(dateRange.dateType.name, level),
  );

  // Add errors for all invalid dates (missing startDate and/or endDate)
  requiredRanges.forEach((dateRange) => {
    if (!dateRange.startDate) {
      context.addError(
        // Show the error below the end date field
        elements.dateField(dateRange.id || dateRange.tempId, "startDate"),
        "Required",
      );
    }

    if (!dateRange.endDate) {
      context.addError(
        // Show the error below the end date field
        elements.dateField(dateRange.id || dateRange.tempId, "endDate"),
        "Required",
      );
    }
  });
}
