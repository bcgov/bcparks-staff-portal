import { DateRange, DateType } from "../models/index.js";

// FCFS dates calculation helper function

// Example 1
// Reservation dates are in the range of Operation dates

// Operation: 2025-03-21 to 2025-10-13
// Reservation: 2025-03-28 to 2025-10-12
// First come: 2025-03-21 to 2025-03-27
// => From Operation start date to Reservation start date minus 1

// Example 2
// Operation dates start earlier than Reservation dates
// Operation dates end later than Reservation dates

// Operation: 2025-04-01 to 2025-10-31
// Reservation: 2025-05-10 to 2025-10-12
// First come 1: 2025-04-01 to 2025-05-09
// => From Operation start date to Reservation start date minus 1
// First come 2: 2025-10-13 to 2025-10-30
// => From Reservation end date plus 1 to Operation end date minus 1

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

    const dateTypeMap = new Map(
      dateTypes.map((dateType) => [dateType.name, dateType.id]),
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
          dateTypeId: dateTypeMap.get("First come, first served"),
          startDate: firstComeStartDate,
          endDate: firstComeEndDate,
        });
      }

      // Calculate the second "First come, first served" DateRange (after Reservation)
      if (operationDateRange.endDate > reservationDateRange.endDate) {
        const firstComeStartDate = new Date(reservationDateRange.endDate);

        firstComeStartDate.setDate(firstComeStartDate.getDate() + 1);

        // Subtract one day from operation end date
        const firstComeEndDate = new Date(operationDateRange.endDate);

        firstComeEndDate.setDate(firstComeEndDate.getDate() - 1);

        firstComeDateRanges.push({
          seasonId: season.id,
          dateTypeId: dateTypeMap.get("First come, first served"),
          startDate: firstComeStartDate,
          endDate: firstComeEndDate,
        });
      }

      // Create the new DateRanges in the database
      if (firstComeDateRanges.length > 0) {
        await DateRange.bulkCreate(firstComeDateRanges);
      }
    }
  }
}
