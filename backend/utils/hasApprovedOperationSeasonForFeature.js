import { Op } from "sequelize";

import { Season } from "../models/index.js";
import * as SEASON_TYPE from "../constants/seasonType.js";
import { APPROVED, PUBLISHED } from "../constants/seasonStatus.js";

const ALLOWED_STATUSES = [APPROVED, PUBLISHED];

/**
 * Returns whether this Feature has the next REGULAR season approved/published
 * for winter-fee propagation.
 * @param {Feature} feature Feature record (with optional parent parkArea)
 * @param {number} operatingYear Winter operating year used as the base
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when the requested regular season exists
 */
export default async function hasApprovedOperationSeasonForFeature(
  feature,
  operatingYear,
  transaction = null,
) {
  const operationPublishableId = feature.parkArea
    ? feature.parkArea.publishableId
    : feature.publishableId;

  if (!operationPublishableId) {
    return false;
  }

  // Winter propagation uses the next regular season as the source constraint.
  const operationSeason = await Season.findOne({
    attributes: ["id"],
    where: {
      publishableId: operationPublishableId,
      operatingYear: operatingYear + 1,
      seasonType: SEASON_TYPE.REGULAR,
      status: {
        [Op.in]: ALLOWED_STATUSES,
      },
    },
    transaction,
  });

  return Boolean(operationSeason);
}
