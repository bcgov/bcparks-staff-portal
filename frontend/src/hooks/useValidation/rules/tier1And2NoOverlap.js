import { areIntervalsOverlapping } from "date-fns";

import consolidateRanges from "@/lib/consolidateDateRanges";

/**
 * Validates that Tier 1 dates do not overlap with Tier 2 dates.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function tier1And2NoOverlap(seasonData, context) {
  const { dateRanges, elements } = context;
  const { current } = seasonData;

  // This rule applies to the Park level. Skip for other levels
  if (context.level !== "park") return;

  // Skip if the Park doesn't have Tier 1 & Tier 2 dates
  if (!(current.park.hasTier1Dates && current.park.hasTier2Dates)) return;

  // Get separate lists of Tier 1 and 2 dates
  const tier1Dates = dateRanges.filter(
    (dateRange) =>
      dateRange.dateType.name === "Tier 1" &&
      dateRange.startDate &&
      dateRange.endDate,
  );
  const tier2Dates = dateRanges.filter(
    (dateRange) => dateRange.dateType.name === "Tier 2",
  );

  // Skip if Tier 1 and 2 dates aren't entered yet
  if (tier1Dates.length === 0 || tier2Dates.length === 0) return;

  // Consolidate the Tier 2 dates for comparison. Tier 1 dates will only have one date range.
  const consolidatedTier2Dates = consolidateRanges(tier2Dates);
  const consolidatedTier1Dates = tier1Dates[0];

  // Check if the single Tier 1 date range overlaps with any of the consolidated Tier 2 date ranges
  const hasOverlaps = consolidatedTier2Dates.some((tier2DateRange) =>
    areIntervalsOverlapping(
      {
        start: consolidatedTier1Dates.startDate,
        end: consolidatedTier1Dates.endDate,
      },
      {
        start: tier2DateRange.startDate,
        end: tier2DateRange.endDate,
      },
      // Include cases where the end of one range is the start of the other
      { inclusive: true },
    ),
  );

  if (hasOverlaps) {
    const errorText = "The tier 1 and tier 2 dates must not overlap.";

    // Show the error below the Tier 1 and Tier 2 date range sections
    context.addError(
      elements.dateableDateType(current.park.dateableId, "Tier 1"),
      errorText,
    );

    context.addError(
      elements.dateableDateType(current.park.dateableId, "Tier 2"),
      errorText,
    );
  }
}
