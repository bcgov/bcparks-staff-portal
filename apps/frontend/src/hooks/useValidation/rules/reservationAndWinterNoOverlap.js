import { areIntervalsOverlapping } from "date-fns";
import { groupBy } from "lodash-es";

import consolidateRanges from "@/lib/consolidateDateRanges";

/**
 * Validates that Feature/Area Reservation dates do not overlap with Park-level Winter fee dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function reservationAndWinterNoOverlap(seasonData, context) {
  const { dateRanges, elements, parkWinterDates } = context;

  // This rule applies to the Feature and ParkArea level. Skip for Parks
  if (context.level === "park") return;

  // Get a list of the populated Reservation dates on this form
  const allReservationDates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Reservation" &&
      dateRange.startDate &&
      dateRange.endDate,
  );

  // Group reservation dateRanges by dateableId so we can test each dateable feature
  const reservationDatesByFeature = groupBy(allReservationDates, "dateableId");

  // Consolidate Park-level winter dates for comparison
  const consolidatedWinterDates = consolidateRanges(parkWinterDates);

  Object.entries(reservationDatesByFeature).forEach(
    ([dateableId, dateableDateRanges]) => {
      // Consolidate Feature reservation dates for comparison
      const consolidatedReservationDates =
        consolidateRanges(dateableDateRanges);

      // Check every winter date range for overlaps with reservation dates
      const hasOverlaps = consolidatedWinterDates.some((winterDateRange) =>
        // Check for overlaps with any reservation date range
        consolidatedReservationDates.some((reservationDateRange) =>
          areIntervalsOverlapping(
            {
              start: winterDateRange.startDate,
              end: winterDateRange.endDate,
            },
            {
              start: reservationDateRange.startDate,
              end: reservationDateRange.endDate,
            },
            // Include cases where the end of one range is the start of the other
            { inclusive: true },
          ),
        ),
      );

      if (hasOverlaps) {
        // Show the error below the Reservation section
        context.addError(
          elements.dateableDateType(dateableId, "Reservation"),
          "The reservation dates must not overlap with winter dates. (To change winter dates, edit the park)",
        );
      }
    },
  );
}
