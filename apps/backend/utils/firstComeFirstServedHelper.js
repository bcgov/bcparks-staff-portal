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

/**
 * Determines if a feature type is eligible for FCFS date range generation
 * @param {string} featureTypeName The name of the feature type to check
 * @returns {boolean} True if the feature type supports FCFS, false otherwise
 */
function isFCFSFeatureType(featureTypeName) {
  if (!featureTypeName) return false;
  // Handles both Sequelize instance and plain object
  return (
    featureTypeName === "Frontcountry campground" ||
    featureTypeName === "Walk-in camping"
  );
}

/**
 * Creates "First come, first served" date ranges based on Operation and Reservation date ranges
 * @param {number} seasonId The ID of the season to process
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<void>} Resolves when FCFS date ranges are created, or early if conditions aren't met
 */
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

  // Collect all eligible features
  const eligibleFeatures = [];

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
    // Find all features with the correct type
    const matchedFeatures = parkArea.features.filter(
      (feature) =>
        feature.featureType && isFCFSFeatureType(feature.featureType.name),
    );

    matchedFeatures.forEach((feature) => {
      eligibleFeatures.push({
        featureTypeName: feature.featureType.name,
        featureDateableId: feature.dateableId,
      });
    });
  }

  // If no features found in ParkArea, try to find a feature with this publishableId
  if (eligibleFeatures.length === 0) {
    const feature = await Feature.findOne({
      where: { publishableId: season.publishableId },
      include: [{ model: FeatureType, as: "featureType" }],
      transaction,
    });

    if (
      feature &&
      feature.featureType &&
      isFCFSFeatureType(feature.featureType.name)
    ) {
      eligibleFeatures.push({
        featureTypeName: feature.featureType.name,
        featureDateableId: feature.dateableId,
      });
    }
  }

  // Process each eligible feature
  for (const { featureDateableId } of eligibleFeatures) {
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

    // Fetch all DateRanges for this specific feature
    const dateRanges = await DateRange.findAll({
      where: { seasonId: season.id, dateableId: featureDateableId },
      include: [{ model: DateType, as: "dateType" }],
      transaction,
    });

    const operationDateRanges = dateRanges.filter(
      (dateRange) => dateRange.dateType.name === "Operation",
    );
    const reservationDateRanges = dateRanges.filter(
      (dateRange) => dateRange.dateType.name === "Reservation",
    );

    if (operationDateRanges.length > 0 && reservationDateRanges.length > 0) {
      const firstComeDateRanges = [];

      // Process each operation date range individually
      operationDateRanges.forEach((operationDateRange) => {
        // Find reservation ranges that overlap with this operation range
        const overlappingReservations = reservationDateRanges.filter(
          (reservationDateRange) =>
            operationDateRange.startDate <= reservationDateRange.endDate &&
            operationDateRange.endDate >= reservationDateRange.startDate,
        );

        // Process each overlapping reservation
        overlappingReservations.forEach((reservationDateRange) => {
          // Calculate the first "First come, first served" DateRange (before Reservation)
          if (operationDateRange.startDate < reservationDateRange.startDate) {
            const firstComeStartDate = operationDateRange.startDate;
            const firstComeEndDate = new Date(reservationDateRange.startDate);

            // Reduce by one day
            firstComeEndDate.setDate(firstComeEndDate.getDate() - 1);

            if (firstComeStartDate < firstComeEndDate) {
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
            const firstComeEndDate = operationDateRange.endDate;

            firstComeStartDate.setDate(firstComeStartDate.getDate() + 1);
            firstComeEndDate.setDate(firstComeEndDate.getDate() - 1);

            if (firstComeStartDate < firstComeEndDate) {
              firstComeDateRanges.push({
                seasonId: season.id,
                dateableId: featureDateableId,
                dateTypeId: dateTypeMap.get("First come, first served"),
                startDate: firstComeStartDate,
                endDate: firstComeEndDate,
              });
            }
          }
        });
      });

      // Remove duplicates if any
      const uniqueFCFSRanges = firstComeDateRanges.filter(
        (dateRange, index, self) =>
          index ===
          self.findIndex(
            (range) =>
              range.startDate.getTime() === dateRange.startDate.getTime() &&
              range.endDate.getTime() === dateRange.endDate.getTime(),
          ),
      );

      // Create the new DateRanges in the database for this feature
      if (uniqueFCFSRanges.length > 0) {
        console.log(
          `Creating ${uniqueFCFSRanges.length} FCFS date ranges for feature ${featureDateableId}`,
        );
        await DateRange.bulkCreate(uniqueFCFSRanges, { transaction });
      }
    }
  }
}
