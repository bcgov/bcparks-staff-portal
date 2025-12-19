import { format, parse } from "date-fns";

// Month, day, year
const DATE_FORMAT_DEFAULT = "MMMM d, yyyy";
// Abbreviated day of the week, abbreviated month, day
const DATE_FORMAT_SHORT = "EEE, MMM d";
const DATE_FORMAT_SHORT_WITH_YEAR = "EEE, MMM d, yyyy";

export function formatDate(date) {
  return format(date, DATE_FORMAT_DEFAULT);
}

export function formatDateShort(date) {
  return format(date, DATE_FORMAT_SHORT);
}

export function formatDateShortWithYear(date) {
  return format(date, DATE_FORMAT_SHORT_WITH_YEAR);
}

/**
 * Returns a string with the dates formatted "Weekday, Month Day",
 * or a placeholder string if a date is missing.
 * @param {Object} dateRange object with startDate and endDate
 * @param {string} placeholder string to display if the dateRange is incomplete/blank
 * @returns {string} formatted date range
 */
export function formatDateRange(dateRange, placeholder = "") {
  // If the full date range is not provided, return a placeholder string
  if (
    !dateRange ||
    dateRange.startDate === null ||
    dateRange.endDate === null
  ) {
    return placeholder;
  }

  const startDate = formatDateShort(dateRange.startDate);
  const endDate = formatDateShort(dateRange.endDate);

  return `${startDate} – ${endDate}`;
}

/**
 * Returns a string with the dates formatted "Weekday, Month Day, Year"
 * @param {Object} dateRange object with startDate and endDate
 * @returns {string} formatted date range
 */
export function formatPreviousDateRange(dateRange) {
  if (dateRange.startDate === null || dateRange.endDate === null) {
    return "Not provided";
  }

  const startDate = formatDateShortWithYear(dateRange.startDate);
  const endDate = formatDateShortWithYear(dateRange.endDate);

  return `${startDate} – ${endDate}`;
}

// used to properly compare paths
export function removeTrailingSlash(str) {
  if (str.endsWith("/")) {
    return str.slice(0, -1);
  }
  return str;
}

/**
 * Converts a "HH:mm:ss" string (e.g. "14:30:00") to a Date object set to today's date
 * @param {string} timeString "HH:mm:ss" formatted time string
 * @returns {Date|null} Date object set to today's date with the specified time, or null if input is falsy.
 */
export function timeStringToDate(timeString) {
  if (!timeString) return null;

  return parse(timeString, "HH:mm:ss", new Date());
}

/**
 * Converts a Date object to a "HH:mm:ss" string (e.g. "14:30:00")
 * @param {Date|null} date Date object to convert to time string
 * @returns {string|null} "HH:mm:ss" formatted time string, or null if input is falsy.
 */
export function dateToTimeString(date) {
  if (!date) return null;

  // seconds are always set to "00"
  return format(date, "HH:mm:00");
}

/**
 * Updates or adds a dateRangeAnnual in the provided array
 * @param {Array} annuals Array of dateRangeAnnual objects
 * @param {Object} updatedAnnual dateRangeAnnual object to update or add
 * @returns {Array} A new array with the updated or added dateRangeAnnual
 */
export function updateDateRangeAnnualsArray(annuals, updatedAnnual) {
  const index = annuals.findIndex((annual) => {
    if (updatedAnnual?.id) {
      return annual.id === updatedAnnual.id;
    }
    if (updatedAnnual?.tempId) {
      return annual.tempId === updatedAnnual.tempId;
    }
    return false;
  });

  if (index !== -1) {
    // Update existing
    const updated = [...annuals];

    updated[index] = { ...annuals[index], ...updatedAnnual, changed: true };
    return updated;
  }
  // Add new, ensure tempId
  let annualToAdd = updatedAnnual;

  if (!updatedAnnual.tempId) {
    annualToAdd = { ...updatedAnnual, tempId: crypto.randomUUID() };
  }
  return [...annuals, { ...annualToAdd, changed: true }];
}
