import { areIntervalsOverlapping } from "date-fns";

import consolidateRanges from "@/lib/consolidateDateRanges";

/**
 * Validates that Park-level Winter fee dates do not overlap with Feature/Area Reservation dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function winterAndReservationNoOverlap(seasonData, context) {
  const { dateRanges, elements, featureReservationDates } = context;
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

  // Consolidate Park-level winter dates for comparison
  const consolidatedWinterDates = consolidateRanges(winterDates);

  // Consolidate Feature reservation dates for comparison
  const consolidatedReservationDates = consolidateRanges(
    featureReservationDates,
  );

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
    // Show the error below the Winter fee date range section
    context.addError(
      elements.dateableDateType(current.park.dateableId, "Winter fee"),
      "Winter dates must not overlap with reservation dates. (To change reservation dates, edit campground)",
    );
  }
}
