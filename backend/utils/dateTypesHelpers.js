import { DateType } from "../models/index.js";
import * as DATE_TYPE from "../constants/dateType.js"

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
      "strapiDateTypeId",
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
 * @param {Object} dateTypesByDateTypeId Object mapping date type strapiDateTypeId to objects
 * @returns {Array} Applicable DateType objects for the Park, in order
 */
export function getDateTypesForPark(park, dateTypesByDateTypeId) {
  // Return the DateTypes in a specific order
  const orderedDateTypes = [];

  // Add applicable date types for the Park
  if (park.hasTier1Dates) {
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.TIER_1]);
  }
  if (park.hasTier2Dates) {
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.TIER_2]);
  }
  if (park.hasWinterFeeDates) {
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.WINTER_FEE]);
  }

  return orderedDateTypes;
}

/**
 * Returns the DateTypes applicable to a Feature in a specific order.
 * For Features, it includes Operation, Reservation, and Backcountry registration dates if applicable.
 * @param {Object} feature Feature object
 * @param {Object} dateTypesByDateTypeId Object mapping date type strapiDateTypeId to objects
 * @returns {Array} An array of DateType objects in the specified order.
 */
export function getDateTypesForFeature(feature, dateTypesByDateTypeId) {
  // Return the DateTypes in a specific order
  const orderedDateTypes = [dateTypesByDateTypeId[DATE_TYPE.OPERATION]];

  // Add applicable date types for the Feature
  if (feature.hasReservations) {
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.RESERVATION]);
  }
  if (feature.hasBackcountryPermits) {
    orderedDateTypes.push(dateTypesByDateTypeId[DATE_TYPE.BACKCOUNTRY_REGISTRATION]);
  }

  return orderedDateTypes;
}
