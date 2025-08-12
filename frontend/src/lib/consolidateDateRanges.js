import { isAfter, max } from "date-fns";
import { cloneDeep, orderBy } from "lodash-es";

/**
 * Returns a chronological list of date ranges with overlapping ranges combined
 * @param {Array} ranges An array of objects with startDate and endDate properties
 * @returns {Array} An array of consolidated date ranges
 */
export default function consolidateRanges(ranges) {
  // Filter out any missing values
  const filteredRanges = ranges.filter(
    (range) => range.startDate && range.endDate,
  );

  // Sort ranges by start date
  const sorted = orderBy(cloneDeep(filteredRanges), ["startDate"]);

  // Combine overlapping ranges
  const consolidated = sorted.reduce((merged, current) => {
    const lastRange = merged.at(-1);

    // If the start date of the current range is before (or the same as)
    // the end date of the last range, combine the ranges
    if (lastRange && !isAfter(current.startDate, lastRange.endDate)) {
      lastRange.endDate = max([lastRange.endDate, current.endDate]);
    } else {
      merged.push(current);
    }

    return merged;
  }, []);

  return consolidated;
}
