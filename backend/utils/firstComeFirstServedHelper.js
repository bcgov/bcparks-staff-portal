import {
  DateRange,
  DateType,
  Season,
  ParkArea,
  Feature,
  FeatureType,
} from "../models/index.js";

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

export async function createFirstComeFirstServedDateRange(
  seasonId,
  transaction = null,
) {
  // Fetch the season
  const season = await Season.findOne({
    where: { id: seasonId },
    transaction,
  });

  if (!season) {
    console.warn(`Season with id ${seasonId} not found.`);
    return;
  }

  // Determine featureTypeName by publishableId
  let featureTypeName = null;
  let featureDateableId = null;

  // Try to find a ParkArea with this publishableId first
  const parkArea = await ParkArea.findOne({
    where: { publishableId: season.publishableId },
    include: [
      {
        model: Feature,
        as: "features",
        include: [
          {
            model: FeatureType,
            as: "featureType",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    transaction,
  });

  if (parkArea && parkArea.features && parkArea.features.length > 0) {
    // Find any feature with the correct type
    const matchedFeature = parkArea.features.find(
      (feature) =>
        feature.featureType &&
        (feature.featureType.name === "Frontcountry campground" ||
          feature.featureType.name === "Walk-in camping"),
    );

    if (matchedFeature && matchedFeature.featureType) {
      featureTypeName = matchedFeature.featureType.name;
      featureDateableId = matchedFeature.dateableId;
    }
  }

  // If not found, try to find a Feature with this publishableId
  if (!featureTypeName) {
    const feature = await Feature.findOne({
      where: { publishableId: season.publishableId },
      include: [{ model: FeatureType, as: "featureType" }],
      transaction,
    });

    if (
      feature &&
      feature.featureType &&
      (feature.featureType.name === "Frontcountry campground" ||
        feature.featureType.name === "Walk-in camping")
    ) {
      featureTypeName = feature.featureType.name;
      featureDateableId = feature.dateableId;
    }
  }

  // Only proceed for Frontcountry campground or Walk-in camping
  if (
    featureTypeName === "Frontcountry campground" ||
    featureTypeName === "Walk-in camping"
  ) {
    // Find the DateType IDs for "Operation", "Reservation", and "First come, first served"
    const dateTypes = await DateType.findAll({
      where: {
        name: ["Operation", "Reservation", "First come, first served"],
      },
      attributes: ["id", "name"],
      transaction,
    });

    const dateTypeMap = new Map(
      dateTypes.map((dateType) => [dateType.name, dateType.id]),
    );

    // Fetch all DateRanges for this season with their DateType
    const dateRanges = await DateRange.findAll({
      where: { seasonId: season.id, dateableId: featureDateableId },
      include: [{ model: DateType, as: "dateType" }],
      transaction,
    });

    const operationDateRange = dateRanges.find(
      (dateRange) => dateRange.dateType.name === "Operation",
    );
    const reservationDateRange = dateRanges.find(
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

        if (firstComeStartDate <= firstComeEndDate) {
          firstComeDateRanges.push({
            seasonId: season.id,
            dateableId: featureDateableId,
            dateTypeId: dateTypeMap.get("First come, first served"),
            startDate: firstComeStartDate,
            endDate: firstComeEndDate,
          });
        }
      }

      // Calculate the second "First come, first served" DateRange (after Reservation)
      if (operationDateRange.endDate > reservationDateRange.endDate) {
        const firstComeStartDate = new Date(reservationDateRange.endDate);
        const firstComeEndDate = new Date(operationDateRange.endDate);

        firstComeStartDate.setDate(firstComeStartDate.getDate() + 1);
        firstComeEndDate.setDate(firstComeEndDate.getDate() - 1);

        if (firstComeStartDate <= firstComeEndDate) {
          firstComeDateRanges.push({
            seasonId: season.id,
            dateableId: featureDateableId,
            dateTypeId: dateTypeMap.get("First come, first served"),
            startDate: firstComeStartDate,
            endDate: firstComeEndDate,
          });
        }
      }

      // Create the new DateRanges in the database
      if (firstComeDateRanges.length > 0) {
        await DateRange.bulkCreate(firstComeDateRanges, { transaction });
      }
    }
  }
}
