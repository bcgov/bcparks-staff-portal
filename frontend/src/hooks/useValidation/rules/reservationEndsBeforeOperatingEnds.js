import { groupBy } from "lodash-es";
import consolidateRanges from "@/lib/consolidateDateRanges";
import {
  differenceInCalendarDays,
  endOfYear,
  isSameDay,
  startOfYear,
} from "date-fns";

/**
 * Returns true if the consolidated date ranges span from Jan 1 - Dec 31 of the same year
 * @param {Array} consolidateDateRanges array of ordered date ranges
 * @returns {boolean} true if the date ranges span the entire year, false otherwise
 */
function isYearRoundRange(consolidateDateRanges) {
  // Consolidated dates must be a single range
  if (consolidateDateRanges.length !== 1) return false;
  const [dateRange] = consolidateDateRanges;

  // Get Jan 1 and Dec 31 for the year
  const yearStart = startOfYear(dateRange.startDate);
  const yearEnd = endOfYear(dateRange.endDate);

  // Return true if the date range is Jan 1 - Dec 31
  return (
    isSameDay(dateRange.startDate, yearStart) &&
    isSameDay(dateRange.endDate, yearEnd)
  );
}

/**
 * Validates that Feature/Area reservation dates must end at least one day before the operating dates end.
 * This rule doesn't apply for ranges Jan 1-Dec 31, because that is used for entities that operate year-round.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function reservationEndsBeforeOperatingEnds(
  seasonData,
  context,
) {
  // This rule applies to the Feature and ParkArea level. Skip for Parks
  if (context.level === "park") return;

  const { dateRanges, elements } = context;

  // Group dateRanges by dateableId so we can test each dateable feature
  const dateRangesByDateableId = groupBy(dateRanges, "dateableId");

  Object.entries(dateRangesByDateableId).forEach(
    ([dateableId, dateableDateRanges]) => {
      // Group dateRanges by type so we can examine the reservation and operation dates
      const dateRangesByType = groupBy(dateableDateRanges, "dateType.name");
      const { Operation = [], Reservation = [] } = dateRangesByType;

      // Skip validation if there are no reservation or operating dates
      if (Reservation.length === 0) return;
      if (Operation.length === 0) return;

      // Skip validation until all operating and reservation dates are filled in
      const allFilled = [...Operation, ...Reservation].every(
        (dateRange) => dateRange.startDate && dateRange.endDate,
      );

      if (!allFilled) return;

      // Consolidate date ranges of both types as much as possible
      const operationRanges = consolidateRanges(Operation);
      const reservationRanges = consolidateRanges(Reservation);

      // Skip validation if the entity operates year-round (Jan 1-Dec 31)
      if (
        isYearRoundRange(operationRanges) &&
        isYearRoundRange(reservationRanges)
      )
        return;

      // Get the final date of both ranges (the endDate of the last range in each array)
      const operationEndDate = operationRanges.at(-1).endDate;
      const reservationEndDate = reservationRanges.at(-1).endDate;

      // Check the difference between the reservation end date and the operating end date
      const daysDifference = differenceInCalendarDays(
        operationEndDate,
        reservationEndDate,
      );

      // Add an error if the difference between operating and reservation end dates is 1+ days
      if (daysDifference < 1) {
        const errorText =
          "The reservation end date must be one or more days before the operating end date.";

        // Show the error below the Operation and Reservation date range sections
        context.addError(
          elements.dateableDateType(dateableId, "Operation"),
          errorText,
        );

        context.addError(
          elements.dateableDateType(dateableId, "Reservation"),
          errorText,
        );
      }
    },
  );
}
