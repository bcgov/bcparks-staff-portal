import { parseISO, formatISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Month, day, year
const DATE_FORMAT_DEFAULT = "MMMM d, yyyy";
// Abbreviated day of the week, abbreviated month, day
const DATE_FORMAT_SHORT = "EEE, MMM d";
const DATE_FORMAT_SHORT_WITH_YEAR = "EEE, MMM d, yyyy";

export function normalizeToUTCDate(dateObject) {
  return new Date(
    Date.UTC(
      dateObject.getFullYear(),
      dateObject.getMonth(),
      dateObject.getDate(),
    ),
  );
}

/**
 * Formats an ISO date string into a human-readable string
 * @param {string} isoString ISO date string
 * @param {string} formatString date-fns formatting string
 * @returns {string} The formatted date string
 */
function isoToFormattedString(isoString, formatString) {
  if (!isoString) return "";

  const date = parseISO(isoString);

  return formatInTimeZone(date, "UTC", formatString);
}

export function formatDate(date) {
  return isoToFormattedString(date, DATE_FORMAT_DEFAULT);
}

export function formatDateShort(date) {
  return isoToFormattedString(date, DATE_FORMAT_SHORT);
}

/**
 * Returns a string with the dates formatted "Weekday, Month Day, Year"
 * @param {Object} dateRange object with startDate and endDate
 * @returns {string} formatted date range
 */
export function formatDateRange(dateRange) {
  const startDate = isoToFormattedString(
    dateRange.startDate,
    DATE_FORMAT_SHORT_WITH_YEAR,
  );
  const endDate = isoToFormattedString(
    dateRange.endDate,
    DATE_FORMAT_SHORT_WITH_YEAR,
  );

  return `${startDate} - ${endDate}`;
}

export function formatDatetoISO(date) {
  if (!date) return "";

  return formatISO(date, { representation: "date" });
}

// used to properly compare paths
export function removeTrailingSlash(str) {
  if (str.endsWith("/")) {
    return str.slice(0, -1);
  }
  return str;
}
