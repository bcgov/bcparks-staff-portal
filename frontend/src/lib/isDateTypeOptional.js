export const optionalTypes = {
  // @TODO: use a list of constants for date types
  park: ["Operating", "Tier 2"],
  parkArea: [],
  feature: [],
};

/**
 * Returns true if the date type is optional for the given level.
 * @param {string} dateTypeName the date type to check
 * @param {string} level the level to check against ("park", "parkArea", "feature")
 * @returns {boolean} true if the date type is optional for the level, false otherwise
 */
export default function isDateTypeOptional(dateTypeName, level) {
  return optionalTypes[level]?.includes(dateTypeName) ?? false;
}
