import { addDays, isAfter, max } from "date-fns";
import { cloneDeep, orderBy } from "lodash-es";

/**
 * Returns a chronological list of date ranges with overlapping ranges combined
 * @param {Array} ranges An array of objects with startDate and endDate properties
 * @param {boolean} [combineAdjacent=true] Whether to combine adjacent date ranges
 * @returns {Array} An array of consolidated date ranges
 */
export default function consolidateRanges(ranges, combineAdjacent = true) {
  // Filter out any missing values
  const filteredRanges = ranges.filter(
    (range) => range.startDate && range.endDate,
  );

  // Sort ranges by start date
  const sorted = orderBy(cloneDeep(filteredRanges), ["startDate"]);

  // Combine overlapping ranges
  const consolidated = sorted.reduce((merged, current) => {
    const lastRange = merged.at(-1);

    // If this is the first range, just add it
    if (!lastRange) {
      merged.push(current);
      return merged;
    }

    // Determine the end date to use for comparison
    // Include the day after the last end date to combine adjacent dates
    const lastEnd = combineAdjacent
      ? addDays(lastRange.endDate, 1) // Jan 1-2 combines with Jan 3-4 into Jan 1-4
      : lastRange.endDate; // Jan 1-2 is separate from Jan 3-4

    // If the start date of the current range is before (or the same as)
    // the end date of the last range, combine the ranges
    if (!isAfter(current.startDate, lastEnd)) {
      lastRange.endDate = max([lastRange.endDate, current.endDate]);
    } else {
      merged.push(current);
    }

    return merged;
  }, []);

  return consolidated;
}
