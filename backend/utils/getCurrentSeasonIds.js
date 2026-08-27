import _ from "lodash";

/**
 * Returns the ID of the most recent season (highest operatingYear) per seasonType.
 * @param {Array<Object>} seasons Array of season objects
 * @returns {Array<number>} Array of current season IDs
 */
export default function getCurrentSeasonIds(seasons) {
  return Object.values(_.groupBy(seasons, "seasonType"))
    .map((group) => _.maxBy(group, "operatingYear")?.id)
    .filter(Boolean);
}
