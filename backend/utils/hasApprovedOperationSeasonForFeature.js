import { Op } from "sequelize";

import { Season } from "../models/index.js";
import * as SEASON_TYPE from "../constants/seasonType.js";

/**
 * Returns whether this Feature has an approved/published REGULAR season context
 * for the given operating year.
 * @param {Feature} feature Feature record (with optional parent parkArea)
 * @param {number} operatingYear Operating year to look up
 * @param {Array<string>} allowedStatuses Season statuses that qualify for propagation
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<boolean>} True when an approved/published REGULAR season exists
 */
export default async function hasApprovedOperationSeasonForFeature(
  feature,
  operatingYear,
  allowedStatuses,
  transaction = null,
) {
  const operationPublishableId = feature.parkArea
    ? feature.parkArea.publishableId
    : feature.publishableId;

  if (!operationPublishableId) {
    return false;
  }

  const operationSeason = await Season.findOne({
    attributes: ["id"],
    where: {
      publishableId: operationPublishableId,
      operatingYear,
      seasonType: SEASON_TYPE.REGULAR,
      status: {
        [Op.in]: allowedStatuses,
      },
    },
    transaction,
  });

  return Boolean(operationSeason);
}
