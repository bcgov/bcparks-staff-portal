import { format, parseISO, formatISO } from "date-fns";

// Month, day, year
const DATE_FORMAT_DEFAULT = "MMMM d, yyyy";
// Abbreviated day of the week, abbreviated month, day
const DATE_FORMAT_SHORT = "EEE, MMM d";
// Abbreviated month, day, year, time
const DATE_FORMAT_TIMESTAMP = "MMM d, yyyy, h:mm a";

/**
 * Formats an ISO date string into a human-readable string
 * @param {string} isoString ISO date string
 * @param {string} formatString date-fns formatting string
 * @returns {string} The formatted date string
 */
function isoToFormattedString(isoString, formatString) {
  if (!isoString) return "";

  const date = parseISO(isoString);

  return format(date, formatString);
}

export function formatDate(date) {
  return isoToFormattedString(date, DATE_FORMAT_DEFAULT);
}

export function formatDateShort(date) {
  return isoToFormattedString(date, DATE_FORMAT_SHORT);
}

export function formatDateRange(dateRange) {
  const startDate = formatDate(dateRange.startDate);
  const endDate = formatDate(dateRange.endDate);

  return `${startDate} - ${endDate}`;
}

export function formatTimestamp(timestamp) {
  return isoToFormattedString(timestamp, DATE_FORMAT_TIMESTAMP);
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
