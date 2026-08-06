import "../../env.js";

import { Op } from "sequelize";
import {
  DateRange,
  Feature,
  FeatureType,
  ParkArea,
  Season,
} from "../../models/index.js";
import * as FEATURE_TYPE from "../../constants/featureType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";
import * as STATUS from "../../constants/seasonStatus.js";

const TARGET_FEATURE_TYPES = new Set([
  FEATURE_TYPE.GROUP_CAMPGROUND,
  FEATURE_TYPE.PICNIC_SHELTER,
]);

/**
 * Updates Group campground and Picnic shelter regular seasons status to "published"
 * for a specific operating year when those seasons already contain dated ranges.
 * @param {number} operatingYear The operating year to repair (defaults to 2026 when run directly)
 * @returns {Promise<number>} Number of seasons updated
 */
export async function fixGroupPicnicSeasonStatus(operatingYear) {
  if (Number.isNaN(Number(operatingYear))) {
    throw new Error("Invalid operating year");
  }

  const transaction = await Season.sequelize.transaction();

  // Get Group/Picnic seasons with status "requested" that have dated ranges for the specified operating year
  try {
    const seasons = await Season.findAll({
      attributes: ["id", "operatingYear", "status"],
      where: {
        operatingYear,
        seasonType: SEASON_TYPE.REGULAR,
        status: STATUS.REQUESTED,
      },
      include: [
        {
          model: Feature,
          as: "feature",
          required: false,
          include: [
            {
              model: FeatureType,
              as: "featureType",
              required: false,
            },
          ],
        },
        {
          model: ParkArea,
          as: "parkArea",
          required: false,
          include: [
            {
              model: Feature,
              as: "features",
              required: false,
              where: {
                active: true,
                hasDates: true,
              },
              include: [
                {
                  model: FeatureType,
                  as: "featureType",
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: DateRange,
          as: "dateRanges",
          required: true,
          where: {
            startDate: { [Op.ne]: null },
            endDate: { [Op.ne]: null },
          },
        },
      ],
      transaction,
    });

    // Check if any of the seasons are associated with a Group campground or Picnic shelter feature type
    const eligibleSeasons = seasons.filter((season) => {
      const standaloneFeatureTypeNumber = Number(
        season.feature?.featureType?.featureTypeNumber,
      );

      const hasStandaloneFeatureGroupOrPicnic = TARGET_FEATURE_TYPES.has(
        standaloneFeatureTypeNumber,
      );

      const hasFeatureGroupOrPicnic = (season.parkArea?.features ?? []).some(
        (feature) =>
          TARGET_FEATURE_TYPES.has(
            Number(feature.featureType?.featureTypeNumber),
          ),
      );

      return hasStandaloneFeatureGroupOrPicnic || hasFeatureGroupOrPicnic;
    });

    const seasonIds = eligibleSeasons.map((season) => season.id);

    if (seasonIds.length === 0) {
      await transaction.commit();
      console.log(
        `No Group/Picnic requested seasons with dates found for operating year ${operatingYear}.`,
      );
      return 0;
    }

    for (const season of eligibleSeasons) {
      const targetName = season.parkArea?.name ?? season.feature?.name ?? null;
      const targetType = season.parkArea ? "ParkArea" : "Feature";

      console.log(
        `Updating ${targetType} ${targetName ?? "(unnamed)"} season ${season.id} for operating year ${season.operatingYear}.`,
      );
    }

    const [updatedCount] = await Season.update(
      { status: STATUS.PUBLISHED },
      {
        where: {
          id: {
            [Op.in]: seasonIds,
          },
        },
        transaction,
      },
    );

    await transaction.commit();

    console.log(
      `Updated ${updatedCount} Group/Picnic season(s) from requested to published for operating year ${operatingYear}.`,
    );

    return updatedCount;
  } catch (error) {
    await transaction.rollback();
    console.error("Failed to fix Group/Picnic season status:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const operatingYearArg = process.argv[2];
  const operatingYear = operatingYearArg ? Number(operatingYearArg) : 2026;

  fixGroupPicnicSeasonStatus(operatingYear).catch((error) => {
    console.error("Error fixing Group/Picnic season statuses:", error);
    throw error;
  });
}
