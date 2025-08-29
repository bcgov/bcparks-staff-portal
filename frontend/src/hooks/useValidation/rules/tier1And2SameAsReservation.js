import { isEqual } from "date-fns";

import consolidateRanges from "@/lib/consolidateDateRanges";

/**
 * Validates that the Park-level Tier 1 and 2 dates match the reservation dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function tier1And2SameAsReservation(seasonData, context) {
  const { dateRanges, elements, featureReservationDates } = context;
  const { current } = seasonData;

  // This rule applies to the Park level. Skip for other levels
  if (context.level !== "park") return;

  // Skip if the Park doesn't have Tier 1 or Tier 2 dates
  if (!(current.park.hasTier1Dates || current.park.hasTier2Dates)) return;

  // Skip if Tier 1 and Reservation dates are not provided
  const tier1Dates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Tier 1" &&
      dateRange.startDate &&
      dateRange.endDate,
  );
  const tier2Dates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Tier 2" &&
      dateRange.startDate &&
      dateRange.endDate,
  );

  // Consolidate Tier 1 + 2 ranges for comparison
  const consolidatedTierDates = consolidateRanges([
    ...tier1Dates,
    ...tier2Dates,
  ]);

  // Consolidate Reservation dates for comparison
  const consolidatedReservationDates = consolidateRanges(
    featureReservationDates,
  );

  // Skip if there are no reservation dates, or if the Park doesn't have Tier 1 dates
  if (consolidatedReservationDates.length === 0 || tier1Dates.length === 0)
    return;

  // Compare consolidated date arrays
  const sameDates =
    consolidatedTierDates.length === consolidatedReservationDates.length &&
    consolidatedTierDates.every((dateRangeA, index) => {
      const dateRangeB = consolidatedReservationDates[index];

      // Return true if the date range covers the same dates
      return (
        isEqual(dateRangeA.startDate, dateRangeB.startDate) &&
        isEqual(dateRangeA.endDate, dateRangeB.endDate)
      );
    });

  if (!sameDates) {
    const errorText =
      "The tier 1 and tier 2 dates must include all reservation dates. (To change reservation dates, edit the park’s reservable features)";

    // Show the error below the Tier 1 and Tier 2 date range sections
    context.addError(
      elements.dateableDateType(current.park.dateableId, "Tier 1"),
      errorText,
    );

    context.addError(
      elements.dateableDateType(current.park.dateableId, "Tier 2"),
      errorText,
    );
  }
}
