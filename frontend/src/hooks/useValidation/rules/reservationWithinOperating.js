import { groupBy } from "lodash-es";
import consolidateRanges from "@/lib/consolidateDateRanges";
import isDateRangeWithinDateRange from "@/lib/isDateRangeWithinDateRange";

/**
 * Validates that Feature/Area reservation dates must be within its operating dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function reservationWithinOperating(seasonData, context) {
  // This rule applies to the Feature and ParkArea level. Skip for Parks
  if (context.level === "park") return;

  const { dateRanges } = context;

  // Group dateRanges by dateableId so we can test each dateable feature
  const dateRangesByDateableId = groupBy(dateRanges, "dateableId");

  Object.entries(dateRangesByDateableId).forEach(
    ([dateableId, dateableDateRanges]) => {
      // Group dateRanges by type so we can examine the reservation and operation dates
      const dateRangesByType = groupBy(dateableDateRanges, "dateType.name");
      const { Operation = [], Reservation = [] } = dateRangesByType;

      // Skip validation if there are no reservation dates
      if (Reservation.length === 0) return;

      // Skip validation until all operating and reservation dates are filled in
      const allFilled = [...Operation, ...Reservation].every(
        (dateRange) => dateRange.startDate && dateRange.endDate,
      );

      if (!allFilled) return;

      // Consolidate date ranges of both types as much as possible
      const operationRanges = consolidateRanges(Operation);
      const reservationRanges = consolidateRanges(Reservation);

      // Check if every reservationRange is within an operationRange
      const allWithin = reservationRanges.every((reservationRange) =>
        operationRanges.some((operationRange) =>
          isDateRangeWithinDateRange(operationRange, reservationRange),
        ),
      );

      if (!allWithin) {
        context.addError(
          // Show the error below the Dateable's form section
          `feature-form-section-${dateableId}`,
          "Enter the reservation dates that fall within the operating dates selected.",
        );
      }
    },
  );
}
