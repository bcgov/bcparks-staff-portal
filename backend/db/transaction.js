// Provides retry support for transient PostgreSQL database errors.
import sequelize from "./connection.js";

const MAX_TRANSACTION_ATTEMPTS = 3;
const TRANSACTION_RETRY_DELAYS_MS = [1000, 3000];
const TRANSIENT_CONNECTION_ERROR_CODES = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ETIMEDOUT",
]);

/**
 * Determines whether a database connection error is likely to succeed if retried.
 * @param {Error & {code?: string, parent?: Error, original?: Error, cause?: Error}} error
 *   Error raised while opening a database connection
 * @returns {boolean} Whether the error has a transient connection error code
 */
function isTransientConnectionError(error) {
  return TRANSIENT_CONNECTION_ERROR_CODES.has(
    error?.code ||
      error?.parent?.code ||
      error?.original?.code ||
      error?.cause?.code,
  );
}

/**
 * Opens a Sequelize transaction, retrying transient PostgreSQL connection errors.
 * Retries are limited to three attempts with one- and three-second delays. Other
 * errors, and transient errors after the final attempt, are re-thrown unchanged.
 * @returns {Promise<import("sequelize").Transaction>} A new Sequelize transaction
 * @throws {Error} If a transaction cannot be created
 */
export async function createTransactionWithRetry() {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await sequelize.transaction();
    } catch (error) {
      const canRetry =
        attempt < MAX_TRANSACTION_ATTEMPTS && isTransientConnectionError(error);

      if (!canRetry) throw error;

      const retryDelay = TRANSACTION_RETRY_DELAYS_MS[attempt - 1];

      console.error(
        `Unable to connect to PostgreSQL (attempt ${attempt}/${MAX_TRANSACTION_ATTEMPTS}). ` +
          `Retrying in ${retryDelay}ms:`,
        error,
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Unable to create database transaction");
}

/**
 * Executes a database operation, retrying transient PostgreSQL connection errors.
 * @template T
 * @param {() => Promise<T>} operation Database operation to execute
 * @returns {Promise<T>} The result of the database operation
 * @throws {Error} If the operation fails with a non-transient error or exhausts its retries
 */
export async function executeWithRetry(operation) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const canRetry =
        attempt < MAX_TRANSACTION_ATTEMPTS && isTransientConnectionError(error);

      if (!canRetry) throw error;

      const retryDelay = TRANSACTION_RETRY_DELAYS_MS[attempt - 1];

      console.error(
        `Database operation failed (attempt ${attempt}/${MAX_TRANSACTION_ATTEMPTS}). ` +
          `Retrying in ${retryDelay}ms:`,
        error,
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error("Database operation failed after maximum retry attempts");
}
