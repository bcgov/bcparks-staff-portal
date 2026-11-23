import { Op } from "sequelize";
import {
  DateRange,
  DateType,
  Feature,
  Park,
  ParkArea,
  Season,
} from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { getCurrentDateCollectionYear } from "../../utils/operatingYearHelper.js";

/**
 * Deletes current-year Winter fee dates that are stale because their entity's
 * hasWinterFeeDates flag is false.
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<number>} Number of deleted date ranges
 */
export default async function deleteStaleWinterFeeDates(transaction = null) {
  // Resolve the Winter fee type so unrelated date ranges are never selected.
  const winterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { dateTypeNumber: DATE_TYPE.WINTER_FEE },
    transaction,
  });

  if (!winterFeeType) {
    throw new Error("Winter fee DateType not found.");
  }

  // Find disabled records at each level, then collect their dateable IDs.
  const disabledRecords = await Promise.all(
    [Park, ParkArea, Feature].map((model) =>
      model.findAll({
        attributes: ["dateableId"],
        where: { hasWinterFeeDates: false },
        transaction,
      }),
    ),
  );
  const dateableIds = disabledRecords
    .flat()
    .map((record) => record.dateableId)
    .filter(Boolean);

  if (!dateableIds.length) {
    return 0;
  }

  // Limit removal to the current Winter date-collection year.
  const operatingYear = await getCurrentDateCollectionYear(
    SEASON_TYPE.WINTER,
    transaction,
  );

  // Select only Winter fee ranges belonging to those entities and that year.
  const ranges = await DateRange.findAll({
    attributes: ["id"],
    where: {
      dateTypeId: winterFeeType.id,
      dateableId: { [Op.in]: dateableIds },
    },
    include: [
      {
        model: Season,
        as: "season",
        attributes: [],
        required: true,
        where: { seasonType: SEASON_TYPE.WINTER, operatingYear },
      },
    ],
    transaction,
  });

  if (!ranges.length) {
    return 0;
  }

  // Remove only the selected stale ranges; keep seasons and other years intact.
  return DateRange.destroy({
    where: { id: { [Op.in]: ranges.map((range) => range.id) } },
    transaction,
  });
}
