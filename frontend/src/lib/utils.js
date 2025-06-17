import { formatInTimeZone } from "date-fns-tz";

// Month, day, year
const DATE_FORMAT_DEFAULT = "MMMM d, yyyy";
// Abbreviated day of the week, abbreviated month, day
const DATE_FORMAT_SHORT = "EEE, MMM d";
const DATE_FORMAT_SHORT_WITH_YEAR = "EEE, MMM d, yyyy";

/**
 * Converts a Date to a UTC Date at midnight on the same day
 * (Adds 7/8 hours to a local Date at midnight)
 * @param {Date|null} dateObject local date object
 * @returns {Date|null} UTC zoned date object
 */
export function normalizeToUTCDate(dateObject) {
  // Allow null dates to pass through
  if (!dateObject) return null;

  return new Date(
    Date.UTC(
      dateObject.getFullYear(),
      dateObject.getMonth(),
      dateObject.getDate(),
    ),
  );
}

/**
 * Converts a UTC Date to a local Date at midnight on the same day
 * (Removes 7/8 hours from a UTC Date at midnight)
 * @param {Date|null} dateObject UTC zoned date object
 * @returns {Date|null} local date object
 */
export function normalizeToLocalDate(dateObject) {
  // Allow null dates to pass through
  if (!dateObject) return null;

  return new Date(
    dateObject.getUTCFullYear(),
    dateObject.getUTCMonth(),
    dateObject.getUTCDate(),
  );
}

export function formatDate(date, timezone = "UTC") {
  return formatInTimeZone(date, timezone, DATE_FORMAT_DEFAULT);
}

export function formatDateShort(date, timezone = "UTC") {
  return formatInTimeZone(date, timezone, DATE_FORMAT_SHORT);
}

export function formatDateShortWithYear(date, timezone = "UTC") {
  return formatInTimeZone(date, timezone, DATE_FORMAT_SHORT_WITH_YEAR);
}

/**
 * Returns a string with the dates formatted "Weekday, Month Day"
 * @param {Object} dateRange object with startDate and endDate
 * @returns {string} formatted date range
 */
export function formatDateRange(dateRange) {
  if (dateRange.startDate === null || dateRange.endDate === null) {
    return "Not provided";
  }

  const startDate = formatDateShort(dateRange.startDate);
  const endDate = formatDateShort(dateRange.endDate);

  return `${startDate} – ${endDate}`;
}

// used to properly compare paths
export function removeTrailingSlash(str) {
  if (str.endsWith("/")) {
    return str.slice(0, -1);
  }
  return str;
}
