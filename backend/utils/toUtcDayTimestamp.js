/**
 * Converts a Date or YYYY-MM-DD value to a UTC midnight timestamp.
 * @param {Date|string} value Date instance or calendar date string
 * @returns {number} UTC day timestamp, or NaN when the value is invalid
 */
export default function toUtcDayTimestamp(value) {
  if (value instanceof Date) {
    return Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);

    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return Date.UTC(year, month - 1, day);
    }
  }

  return Number.NaN;
}
