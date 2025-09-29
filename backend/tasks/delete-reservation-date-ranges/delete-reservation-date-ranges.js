// This script deletes reservation DateRanges for parks/features where hasReservations is false

import "../../env.js";

import { Op } from "sequelize";
import { DateType, DateRange, Feature } from "../../models/index.js";

async function deleteReservationDateRanges(transaction = null) {
  try {
    // Find the reservation DateType id
    const reservationDateType = await DateType.findOne({
      where: { name: "Reservation" },
      attributes: ["id"],
      transaction,
    });

    if (!reservationDateType) {
      throw new Error("No Reservation DateType found");
    }

    // Find all features with hasReservations false
    const features = await Feature.findAll({
      where: { hasReservations: false },
      attributes: ["dateableId"],
      transaction,
    });
    const featureDateableIds = features.map((feature) => feature.dateableId);

    if (featureDateableIds.length === 0) {
      console.log("No Features found with hasReservations: false");
      return 0;
    }

    // Delete reservation DateRanges for features
    const deleteCount = await DateRange.destroy({
      where: {
        dateTypeId: reservationDateType.id,
        dateableId: {
          [Op.in]: featureDateableIds,
        },
      },
      transaction,
    });

    console.log(
      `Deleted ${deleteCount} Reservation DateRanges where hasReservations is false.`,
    );
    return deleteCount;
  } catch (err) {
    console.error("Error deleting Reservation DateRanges:", err);
    throw err;
  }
}

// Run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await DateRange.sequelize.transaction();

  try {
    await deleteReservationDateRanges(transaction);
    await transaction.commit();
    console.log("Done deleting Reservation DateRanges.");
  } catch (err) {
    await transaction.rollback();
    console.error("Transaction rolled back due to error:", err);
    throw err;
  }
}
