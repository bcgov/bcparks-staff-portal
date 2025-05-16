import { DateRange, DateType } from "../../models/index.js";

// FCFS dates calculation helper function

// Example 1: Operation: 2025-03-21 to 2025-10-13
//            Reservation: 2025-03-28 to 2025-10-12
//            First come: 2025-03-21 to 2025-03-27
// Example 2: Operation: 2025-04-01 to 2025-10-31
//            Reservation: 2025-05-10 to 2025-10-12
//            First come: 2025-04-01 to 2025-05-09
//            First come: 2025-10-13 to 2025-10-31

/**
 * @param {Object} season
 */

export async function createFirstComeFirstServedDateRange(season) {
  // Check if the FeatureType is "Frontcountry camping" or "Walk-in camping"
  if (
    season.featureType.name === "Frontcountry camping" ||
    season.featureType.name === "Walk-in camping"
  ) {
    // Find the DateType IDs for "Operation", "Reservation", and "First come, first served"
    const dateTypes = await DateType.findAll({
      where: {
        name: ["Operation", "Reservation", "First come, first served"],
      },
      attributes: ["id", "name"],
    });

    const dateTypeMap = Object.fromEntries(
      dateTypes.map((dateType) => [dateType.id, dateType.name]),
    );

    const operationDateRange = season.dateRanges.find(
      (dateRange) => dateRange.dateType.name === "Operation",
    );
    const reservationDateRange = season.dateRanges.find(
      (dateRange) => dateRange.dateType.name === "Reservation",
    );

    if (operationDateRange && reservationDateRange) {
      const firstComeDateRanges = [];

      // Calculate the first "First come, first served" DateRange (before Reservation)
      if (operationDateRange.startDate < reservationDateRange.startDate) {
        const firstComeStartDate = operationDateRange.startDate;
        const firstComeEndDate = new Date(reservationDateRange.startDate);

        // Reduce by one day
        firstComeEndDate.setDate(firstComeEndDate.getDate() - 1);

        firstComeDateRanges.push({
          seasonId: season.id,
          dateTypeId: dateTypeMap["First come, first served"],
          startDate: firstComeStartDate,
          endDate: firstComeEndDate,
        });
      }

      // Calculate the second "First come, first served" DateRange (after Reservation)
      if (operationDateRange.endDate > reservationDateRange.endDate) {
        const firstComeStartDate = new Date(reservationDateRange.endDate);

        // Add one day
        firstComeStartDate.setDate(firstComeStartDate.getDate() + 1);
        const firstComeEndDate = operationDateRange.endDate;

        firstComeDateRanges.push({
          seasonId: season.id,
          dateTypeId: dateTypeMap["First come, first served"],
          startDate: firstComeStartDate,
          endDate: firstComeEndDate,
        });
      }

      // Create the new DateRanges in the database
      for (const dateRange of firstComeDateRanges) {
        await DateRange.create(dateRange);
      }
    }
  }
}
