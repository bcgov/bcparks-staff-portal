import { min, max, isBefore } from "date-fns";
import _ from "lodash";

// returns an array of date @TODO: jsdocs

/**
 * Returns an array of date ranges that are common to both sets of dates.
 * @param {Array} winterDates Array of objects with startDate and endDate properties
 * @param {Array} operatingDates Array of objects with startDate and endDate properties
 * @returns {Array} Array of overlapping date ranges, if any
 */
export default function getOverlappingDateRanges(winterDates, operatingDates) {
  const overlaps = _.flatMap(winterDates, (winterRange) => {
    const winterStart = winterRange.startDate;
    const winterEnd = winterRange.endDate;

    // Return an array of overlapping ranges for this winter date range
    const winterOverlaps = operatingDates
      .map((operatingRange) => {
        const operatingStart = operatingRange.startDate;
        const operatingEnd = operatingRange.endDate;

        // Find the latest start date and earliest end date to determine any overlap
        const overlapStart = max([winterStart, operatingStart]);
        const overlapEnd = min([winterEnd, operatingEnd]);

        // Check for overlap (start <= end)
        if (
          isBefore(overlapStart, overlapEnd) ||
          overlapStart.getTime() === overlapEnd.getTime()
        ) {
          return {
            startDate: overlapStart,
            endDate: overlapEnd,
          };
        }

        // If no overlap, return null
        return null;
      })
      .filter(Boolean); // Filter out null values

    return winterOverlaps;
  });

  return overlaps;
}
