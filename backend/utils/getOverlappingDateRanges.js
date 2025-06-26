import { min, max, isBefore } from "date-fns";
import _ from "lodash";

/**
 * Returns an array of date ranges that are common to both sets of dates.
 * @param {Array} dateRangesA Array of objects with startDate and endDate properties
 * @param {Array} dateRangesB Array of objects with startDate and endDate properties
 * @returns {Array} Array of overlapping date ranges, if any
 */
export default function getOverlappingDateRanges(dateRangesA, dateRangesB) {
  const overlaps = _.flatMap(dateRangesA, (rangeA) => {
    const startA = rangeA.startDate;
    const endA = rangeA.endDate;

    // Return an array of overlapping ranges for this individual date range
    const rangeAOverlaps = dateRangesB
      .map((rangeB) => {
        const startB = rangeB.startDate;
        const endB = rangeB.endDate;

        // Find the latest start date and earliest end date to determine any overlap
        const overlapStart = max([startA, startB]);
        const overlapEnd = min([endA, endB]);

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

    return rangeAOverlaps;
  });

  return overlaps;
}
