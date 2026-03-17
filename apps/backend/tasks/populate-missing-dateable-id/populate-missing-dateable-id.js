// This script populates missing dateableId in existing DateRanges
// by looking up the publishableId from the associated Season.

import "../../env.js";
import { Season, DateRange } from "../../models/index.js";
import { findDateableIdByPublishableId } from "../../utils/findDateableIdByPublishableId.js";

export async function populateMissingDateableIdInDateRanges() {
  const transaction = await DateRange.sequelize.transaction();
  let updatedCount = 0;

  try {
    // find all DateRanges with missing dateableId
    const dateRanges = await DateRange.findAll({
      where: { dateableId: null },
      include: [{ model: Season, as: "season" }],
      transaction,
    });

    for (const dateRange of dateRanges) {
      // get associated Season
      const season =
        dateRange.season ||
        (await Season.findByPk(dateRange.seasonId, { transaction }));

      if (!season) {
        console.warn(`No season found for DateRange id=${dateRange.id}`);
        continue;
      }

      // find correct dateableId
      const dateableId = await findDateableIdByPublishableId(
        season.publishableId,
        transaction,
      );

      if (!dateableId) {
        console.warn(
          `No dateableId found for publishableId=${season.publishableId} (DateRange id=${dateRange.id})`,
        );
        continue;
      }

      // update DateRange
      await dateRange.update({ dateableId }, { transaction });
      updatedCount++;
      console.log(
        `Updated DateRange id=${dateRange.id} with dateableId=${dateableId}`,
      );
    }

    await transaction.commit();
    console.log(`Finished. Updated ${updatedCount} DateRanges.`);
  } catch (error) {
    await transaction.rollback();
    console.error("Error populating missing dateableId:", error);
    throw error;
  }
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  populateMissingDateableIdInDateRanges().catch((err) => {
    console.error("Error populating missing dateableId:", err);
    throw err;
  });
}
