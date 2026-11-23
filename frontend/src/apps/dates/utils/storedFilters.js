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
 * Checks that a value is a selected multi-select option: a non-null object with a string name.
 * @param {any} option Array entry from a persisted multi-select filter
 * @returns {boolean} True if the option can be rendered and filtered on
 */
function isValidOption(option) {
  return getValueType(option) === "object" && typeof option?.name === "string";
}

/**
 * Checks that a value is a selected status: a string.
 * @param {any} status Array entry from the persisted status filter
 * @returns {boolean} True if the status is a string
 */
function isValidStatus(status) {
  return typeof status === "string";
}

// Validators for the entries of each array filter
const ARRAY_ENTRY_VALIDATORS = {
  accessGroups: isValidOption,
  status: isValidStatus,
  sections: isValidOption,
  managementAreas: isValidOption,
  dateTypes: isValidOption,
  featureTypes: isValidOption,
};

/**
 * Checks that a persisted filter value has the same type as its default,
 * and that every array entry is valid for that filter.
 * @param {string} name Filter name
 * @param {any} value Persisted filter value
 * @returns {boolean} True if the value can be loaded into component state
 */
function isValidFilterValue(name, value) {
  if (getValueType(value) !== getValueType(DEFAULT_FILTERS[name])) {
    return false;
  }

  if (!Array.isArray(value)) return true;

  return value.every(ARRAY_ENTRY_VALIDATORS[name]);
}

/**
 * Checks that persisted filters have exactly the current filter names,
 * that each value has the same type as its default,
 * and that array filters only contain valid entries.
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
      Object.hasOwn(filters, name) && isValidFilterValue(name, filters[name]),
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
