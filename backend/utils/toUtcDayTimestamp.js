/**
 * Converts a Date object or YYYY-MM-DD string to a numeric UTC timestamp
 * representing the start of the calendar day (00:00:00 UTC). Any
 * time-of-day information is discarded so that only the date remains.
 * This allows dates from different input types to be compared using
 * simple integer comparisons. ISO date-time strings and other string
 * formats are considered invalid and will return NaN.
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
