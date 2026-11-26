import isDateTypeOptional from "@/apps/dates/utils/isDateTypeOptional";
import getDateTypeDisplayName from "@/apps/dates/utils/getDateTypeDisplayName";
import * as DATE_TYPE from "@/apps/dates/constants/dateType";

const PARK_APPLICABILITY_BY_DATE_TYPE = {
  [DATE_TYPE.PARK_GATE_OPEN]: "hasGate",
  [DATE_TYPE.TIER_1]: "hasTier1Dates",
  [DATE_TYPE.TIER_2]: "hasTier2Dates",
  [DATE_TYPE.WINTER_FEE]: "hasWinterFeeDates",
};

/**
 * Validates that the date ranges are provided for required date types.
 * This rule applies to all date types except those that are optional based on the dateType and level.
 * Only flags ranges where both dates are blank; partially-filled ranges are handled by
 * the completeDateRanges rule.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function requiredDateRanges(seasonData, context) {
  const { elements, level } = context;

  // Only validate after the form is submitted
  if (!context.submitted) return;

  const { dateRanges } = context;
  const park = seasonData?.current?.park;

  // Filter out date ranges with optional date types
  const requiredRanges = dateRanges.filter((dateRange) => {
    const dateTypeNumber = dateRange.dateType?.dateTypeNumber;

    if (isDateTypeOptional(dateTypeNumber, level)) {
      return false;
    }

    // If the level is "park", check if the park has the boolean value for the date type
    if (level === "park" && park) {
      const flagName = PARK_APPLICABILITY_BY_DATE_TYPE[dateTypeNumber];

      if (flagName && !park[flagName]) {
        return false;
      }
    }

    return true;
  });

  // Add errors for required ranges with both dates missing
  // (completeDateRanges handles ranges with only one date missing)
  requiredRanges.forEach((dateRange) => {
    // Skip ranges that have at least one date filled in
    if (dateRange.startDate || dateRange.endDate) return;

    context.addError(
      // Show the error below the start date field
      elements.dateField(
        dateRange.id || dateRange.tempId,
        "startDate",
        `${getDateTypeDisplayName(dateRange.dateType.name)} start date`,
        dateRange.dateableId,
      ),
      "Required",
    );

    context.addError(
      // Show the error below the end date field
      elements.dateField(
        dateRange.id || dateRange.tempId,
        "endDate",
        `${getDateTypeDisplayName(dateRange.dateType.name)} end date`,
        dateRange.dateableId,
      ),
      "Required",
    );
  });
}
