import { isEqual } from "date-fns";
import { groupBy } from "lodash-es";

import consolidateRanges from "@/lib/consolidateDateRanges";

/**
 * Validates that the Feature/Area-level reservation dates match the Park-level Tier 1 and 2 dates.
 * Each feature's dates must be the same as the Park's combined Tier 1 and Tier 2 dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function reservationSameAsTier1And2(seasonData, context) {
  const { dateRanges, elements, parkTier1Dates, parkTier2Dates } = context;

  // This rule applies to the Feature and ParkArea level. Skip for Parks
  if (context.level === "park") return;

  // Skip if the Park doesn't have Tier 1 & Tier 2 dates
  if (parkTier1Dates.length === 0 && parkTier2Dates.length === 0) return;

  // Get a list of the populated Reservation dates on this form
  const allReservationDates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Reservation" &&
      dateRange.startDate &&
      dateRange.endDate,
  );

  // Group reservation dates by dateableId
  const reservationDatesByFeature = groupBy(allReservationDates, "dateableId");

  // Consolidate Tier 1 + 2 ranges for comparison
  const consolidatedTierDates = consolidateRanges([
    ...parkTier1Dates,
    ...parkTier2Dates,
  ]);

  // Compare each dateable Feature's reservation dates to the Park's Tier 1 and 2 dates
  Object.entries(reservationDatesByFeature).forEach(
    ([dateableId, reservationDates]) => {
      // Consolidate Reservation dates for comparison
      const consolidatedReservationDates = consolidateRanges(reservationDates);

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
          "The reservation dates must include all tier 1 and tier 2 dates. (To change tier 1 and tier 2 dates, edit the park)";

        // Show the error below the Reservation dates section
        context.addError(
          elements.dateableDateType(dateableId, "Reservation"),
          errorText,
        );
      }
    },
  );
}
