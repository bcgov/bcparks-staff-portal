import { areIntervalsOverlapping } from "date-fns";

import consolidateRanges from "@/lib/consolidateDateRanges";
import * as SEASON_TYPE from "@/constants/seasonType";
import * as DATE_TYPE from "@/constants/dateType";

/**
 * Validates that Park-level Winter fee dates do not overlap with Frontcountry Campground Feature Reservation dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function winterAndReservationNoOverlap(seasonData, context) {
  const { dateRanges, elements, frontcountryFeatureReservationDates } = context;
  const { current } = seasonData;

  // This rule applies to winter seasons only. Skip for regular seasons
  if (current.seasonType !== SEASON_TYPE.WINTER) return;

  // This rule applies to the Park level. Skip for other levels
  if (context.level !== "park") return;

  // Get a list of Park-level winter dates
  const winterDates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.strapiDateTypeId === DATE_TYPE.WINTER_FEE &&
      dateRange.startDate &&
      dateRange.endDate,
  );

  // Consolidate Park-level winter dates for comparison
  const consolidatedWinterDates = consolidateRanges(winterDates);

  // Consolidate Frontcountry Feature reservation dates for comparison
  const consolidatedReservationDates = consolidateRanges(
    frontcountryFeatureReservationDates,
  );

  // Check every winter date range for overlaps with frontcountry campground reservation dates
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
