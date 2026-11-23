// localStorage key for the persisted Submit page table filters
export const FILTERS_STORAGE_KEY = "datesSubmitFilters";

// Default (empty) Submit page table filters
export const DEFAULT_FILTERS = Object.freeze({
  park: null,
  accessGroups: [],
  status: [],
  sections: [],
  managementAreas: [],
  dateTypes: [],
  featureTypes: [],
  isInReservationSystem: false,
});

/**
 * Returns the type of a filter value, treating arrays separately from objects.
 * @param {any} value Filter value
 * @returns {string} "array" or the value's typeof
 */
function getValueType(value) {
  return Array.isArray(value) ? "array" : typeof value;
}

/**
 * Checks that persisted filters have exactly the current filter names,
 * and that each value has the same type as its default.
 * @param {any} filters Parsed filters from localStorage
 * @returns {boolean} True if the filters can be loaded into component state
 */
export function isValidStoredFilters(filters) {
  if (!filters || getValueType(filters) !== "object") return false;

  const storedNames = Object.keys(filters);
  const defaultNames = Object.keys(DEFAULT_FILTERS);

  if (storedNames.length !== defaultNames.length) return false;

  return defaultNames.every(
    (name) =>
      Object.hasOwn(filters, name) &&
      getValueType(filters[name]) === getValueType(DEFAULT_FILTERS[name]),
  );
}

/**
 * Deserializer for useLocalStorage: parses the persisted filters.
 * If they're unreadable or the filter names changed since they were saved,
 * clears them from localStorage and returns the default filters instead.
 * @param {string} value Raw value from localStorage
 * @returns {Object} Filters to load into component state
 */
export function deserializeFilters(value) {
  let parsed = null;

  try {
    parsed = JSON.parse(value);
  } catch {
    // Treat unparseable values as invalid
  }

  if (isValidStoredFilters(parsed)) return parsed;

  try {
    window.localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch {
    // Ignore storage access errors; the defaults are still returned
  }

  return DEFAULT_FILTERS;
}
