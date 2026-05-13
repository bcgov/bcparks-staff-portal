import * as DATE_TYPE from "../constants/dateType.js";

export const optionalTypes = {
  park: [DATE_TYPE.PARK_GATE_OPEN, DATE_TYPE.TIER_2],
  parkArea: [],
  feature: [],
};

/**
 * Returns true if the date type is optional for the given level.
 * @param {number} dateTypeNumber the human-assigned identifier from Strapi to check
 * @param {string} level the level to check against ("park", "parkArea", "feature")
 * @returns {boolean} true if the date type is optional for the level, false otherwise
 */
export default function isDateTypeOptional(dateTypeNumber, level) {
  return optionalTypes[level]?.includes(dateTypeNumber) ?? false;
}
