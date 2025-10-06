// This script deletes reservation DateRanges for parks/features where hasReservations is false

import "../../env.js";

import { Op } from "sequelize";
import { DateType, DateRange, Feature, Season } from "../../models/index.js";

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

    // Find all DateRanges for these features and reservation type
    const dateRanges = await DateRange.findAll({
      where: {
        dateTypeId: reservationDateType.id,
        dateableId: {
          [Op.in]: featureDateableIds,
        },
      },
      include: [
        {
          model: Season,
          as: "season",
          attributes: ["operatingYear"],
        },
      ],
      transaction,
    });

    // Group by feature (dateableId), find max operatingYear per feature
    const latestDateRangeIds = [];
    const grouped = {};

    dateRanges.forEach((dateRange) => {
      const key = dateRange.dateableId;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(dateRange);
    });
    Object.values(grouped).forEach((ranges) => {
      // Find max operatingYear
      const maxYear = Math.max(
        ...ranges.map((range) => range.season?.operatingYear || 0),
      );

      // Find all dateRanges for that year
      ranges.forEach((range) => {
        if (range.season?.operatingYear === maxYear) {
          latestDateRangeIds.push(range.id);
        }
      });
    });

    if (latestDateRangeIds.length === 0) {
      console.log("No Reservation DateRanges found for latest season.");
      return 0;
    }

    // Delete only the latest season's reservation DateRanges
    const deleteCount = await DateRange.destroy({
      where: {
        id: {
          [Op.in]: latestDateRangeIds,
        },
      },
      transaction,
    });

    console.log(
      `Deleted ${deleteCount} Reservation DateRanges for latest season where hasReservations is false.`,
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
