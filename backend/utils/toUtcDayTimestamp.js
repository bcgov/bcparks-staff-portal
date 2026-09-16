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
    const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);

    if (!match) {
      return Number.NaN;
    }

    const [, yearString, monthString, dayString] = match;
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const date = new Date(0);

    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return Number.NaN;
    }

    return date.getTime();
  }

  return Number.NaN;
}
