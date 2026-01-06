/**
 * Shared utility functions for season-related operations.
 * Used by create-seasons and create-winter-seasons scripts.
 */

import { Dateable, Publishable } from "../models/index.js";

/**
 * Creates a new Publishable or Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {string} keyName The name of the key to check ("publishableId" or "dateableId")
 * @param {any} KeyModel Db model to use for creating the new ID (Publishable or Dateable)
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<{key: number, added: boolean}>} The ID and whether it was created
 */
export async function createKey(record, keyName, KeyModel, transaction) {
  if (record[keyName]) return { key: record[keyName], added: false };

  // Create the missing FK record in the junction table
  const junctionKey = await KeyModel.create({}, { transaction });

  record[keyName] = junctionKey.id;
  await record.save({ transaction });
  return { key: junctionKey.id, added: true };
}

/**
 * Creates a new Publishable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<number>} The record's Publishable ID
 */
export async function createPublishableId(record, transaction) {
  const { key, added } = await createKey(
    record,
    "publishableId",
    Publishable,
    transaction,
  );

  return { key, added };
}

/**
 * Creates a new Dateable ID and associates it with the given record, if it doesn't already have one.
 * @param {Park|ParkArea|Feature} record The record to check and update
 * @param {Transaction} transaction The database transaction to use
 * @returns {Promise<number>} The record's Dateable ID
 */
export async function createDateableId(record, transaction) {
  const { key, added } = await createKey(
    record,
    "dateableId",
    Dateable,
    transaction,
  );

  return { key, added };
}
