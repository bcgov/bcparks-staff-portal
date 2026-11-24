import { Op } from "sequelize";
import { DateRange, DateType, Season } from "../../models/index.js";
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import { getCurrentDateCollectionYear } from "../../utils/operatingYearHelper.js";

/**
 * Deletes current-year Winter fee dates that are stale because their entity's
 * hasWinterFeeDates flag is false.
 * @param {number[]} dateableIdsWithWinterFeesDisabled Imported entities whose Winter fee flag is false
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<{deletedCount:number, affectedSeasonIds:number[]}>} Deletion summary
 */
export default async function deleteStaleWinterFeeDates(
  dateableIdsWithWinterFeesDisabled = [],
  transaction = null,
) {
  // Only process records present in this Strapi response
  const dateableIds = [...new Set(dateableIdsWithWinterFeesDisabled)].filter(
    Boolean,
  );

  if (!dateableIds.length) {
    return { deletedCount: 0, affectedSeasonIds: [] };
  }

  // Resolve the Winter fee type so unrelated date ranges are never selected.
  const winterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { dateTypeNumber: DATE_TYPE.WINTER_FEE },
    transaction,
  });

  if (!winterFeeType) {
    throw new Error("Winter fee DateType not found.");
  }

  // Limit removal to the current Winter date-collection year.
  const operatingYear = await getCurrentDateCollectionYear(
    SEASON_TYPE.WINTER,
    transaction,
  );

  // Select only Winter fee ranges belonging to those entities and that year.
  const ranges = await DateRange.findAll({
    attributes: ["id", "seasonId"],
    where: {
      dateTypeId: winterFeeType.id,
      dateableId: { [Op.in]: dateableIds },
    },
    include: [
      {
        model: Season,
        as: "season",
        attributes: ["id"],
        required: true,
        where: { seasonType: SEASON_TYPE.WINTER, operatingYear },
      },
    ],
    transaction,
  });

  if (!ranges.length) {
    return { deletedCount: 0, affectedSeasonIds: [] };
  }

  // Preserve the affected seasons so propagation can rebuild derived Area and
  // Feature ranges after the Park or entity source ranges are removed.
  const affectedSeasonIds = [
    ...new Set(ranges.map((range) => range.seasonId)),
  ].filter(Boolean);

  // Remove only the selected stale ranges; keep seasons and other years intact.
  const deletedCount = await DateRange.destroy({
    where: { id: { [Op.in]: ranges.map((range) => range.id) } },
    transaction,
  });

  return { deletedCount, affectedSeasonIds };
}
