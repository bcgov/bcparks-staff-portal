import { Sequelize } from "sequelize";
import { Season } from "../models/index.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

/**
 * Returns the operating year for which dates are currently being collected for
 * a given season type.
 * - For REGULAR seasons: Returns maxYear - 1 because group sites and picnic
 * shelters have seasons for the next year (longer booking window), but the current
 * date collection year is still considered the year for which campsite dates are
 * being entered.
 * - For WINTER seasons: Returns maxYear as-is (group sites and picnic shelters don't
 * have winter seasons).
 * @param {string} seasonType The season type (REGULAR or WINTER)
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<number>} The operating year for which dates are currently being
 * collected
 */
export async function getCurrentDateCollectionYear(
  seasonType,
  transaction = null,
) {
  const latestSeason = await Season.findOne({
    attributes: [
      [Sequelize.fn("MAX", Sequelize.col("operatingYear")), "maxYear"],
    ],
    where: { seasonType },
    raw: true,
    transaction,
  });

  // if there are no existing seasons for the given season type
  // (i.e. a fresh db), return the current year
  if (!latestSeason?.maxYear) {
    return new Date().getFullYear();
  }

  const maxYear = Number(latestSeason.maxYear);

  return seasonType === SEASON_TYPE.REGULAR ? maxYear - 1 : maxYear;
}
