/**
 * Validates that the DateRanges with a startDate also have an endDate, and vice versa.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function completeDateRanges(seasonData, context) {
  const { dateRanges, elements } = context;

  // Only validate after the form is submitted
  if (!context.submitted) return;

  // Add errors for all invalid dates (dates must be within operatingYear)
  dateRanges.forEach((dateRange) => {
    const idOrTempId = dateRange.id || dateRange.tempId;

    // startDate but no endDate
    if (dateRange.startDate && !dateRange.endDate) {
      context.addError(
        // Show the error below the empty end date field
        elements.dateField(idOrTempId, "endDate"),
        "Enter an end date",
      );
    }

    // endDate but no startDate
    if (dateRange.endDate && !dateRange.startDate) {
      context.addError(
        // Show the error below the empty start date field
        elements.dateField(idOrTempId, "startDate"),
        "Enter a start date",
      );
    }
  });
}
