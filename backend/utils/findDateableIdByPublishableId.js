import { Park, ParkArea, Feature } from "../models/index.js";

/**
 * Finds the dateableId for a given publishableId by searching Park, ParkArea, and Feature.
 * @param {number} publishableId The publishableId to search for
 * @returns {Promise<number|null>} The dateableId or null if not found
 */
export async function findDateableIdByPublishableId(publishableId) {
  // try Park
  const park = await Park.findOne({ where: { publishableId } });

  if (park) return park.dateableId;

  // try ParkArea
  const parkArea = await ParkArea.findOne({ where: { publishableId } });

  if (parkArea) return parkArea.dateableId;

  // try Feature
  const feature = await Feature.findOne({ where: { publishableId } });

  if (feature) return feature.dateableId;

  // not found
  return null;
}
