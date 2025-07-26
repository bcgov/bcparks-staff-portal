import { DateType } from "../models/index.js";

/**
 * Returns an array of all DateTypes, optionally filtered by a WHERE clause.
 * @param {Object} [where={}] Where clause to filter DateTypes (by level, etc.)
 * @param {Transaction} [transaction] Optional Sequelize transaction
 * @returns {Promise<Array<DateType>>} Array of DateTypes
 */
export async function getAllDateTypes(where = {}, transaction = null) {
  return DateType.findAll({
    attributes: [
      "id",
      "name",
      "startDateLabel",
      "endDateLabel",
      "description",
      "parkLevel",
      "parkAreaLevel",
      "featureLevel",
    ],

    where,

    transaction,
  });
}

/**
 * Returns the DateTypes applicable to a Park or Feature in a specific order.
 * @param {Object} park Park object
 * @param {Object} dateTypesByName Object mapping date type name to objects with ids
 * @returns {Array} Applicable DateType objects for the Park, in order
 */
export function getDateTypesForPark(park, dateTypesByName) {
  // Return the DateTypes in a specific order
  const orderedDateTypes = [];

  // Add applicable date types for the Park
  if (park.hasTier1Dates) {
    orderedDateTypes.push(dateTypesByName["Tier 1"]);
  }
  if (park.hasTier2Dates) {
    orderedDateTypes.push(dateTypesByName["Tier 2"]);
  }
  if (park.hasWinterFeeDates) {
    orderedDateTypes.push(dateTypesByName["Winter fee"]);
  }

  return orderedDateTypes;
}

/**
 * Returns the DateTypes applicable to a Feature in a specific order.
 * For Features, it includes Operation, Reservation, and Backcountry registration dates if applicable.
 * @param {Object} feature Feature object
 * @param {Object} dateTypesByName Object mapping date type name to objects with ids
 * @returns {Array} An array of DateType objects in the specified order.
 */
export function getDateTypesForFeature(feature, dateTypesByName) {
  // Return the DateTypes in a specific order
  const orderedDateTypes = [dateTypesByName.Operation];

  // Add applicable date types for the Feature
  if (feature.hasReservations) {
    orderedDateTypes.push(dateTypesByName.Reservation);
  }
  if (feature.hasBackcountryPermits) {
    orderedDateTypes.push(dateTypesByName["Backcountry registration"]);
  }

  return orderedDateTypes;
}
