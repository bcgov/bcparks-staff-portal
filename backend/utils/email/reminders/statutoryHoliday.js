import axios from "axios";
import { addDays, format, isWeekend } from "date-fns";
import { TZDate } from "@date-fns/tz";

const DEFAULT_STAT_HOLIDAY_API =
  "https://canada-holidays.ca/api/v1/provinces/BC";
const BC_TIMEZONE = "America/Vancouver";
// Longest a reminder save waits for an uncached year's holidays
const SAVE_WAIT_MS = 2000;

// Observed holiday dates, keyed by year. Only successful lookups are cached.
const holidayCache = new Map();
// Lookups in progress, keyed by year, so a year is only requested once at a time
const pendingLoads = new Map();

/**
 * Loads the dates BC public service offices are closed for holidays in a year
 * into the cache: BC statutory holidays (including the National Day for Truth
 * and Reconciliation) plus the optional Easter Monday and Boxing Day.
 * Uses each holiday's observed date, so holidays on a weekend are moved to the
 * weekday the office is actually closed.
 * Never rejects: failures are logged and the year is retried on the next load.
 * @param {number} year Calendar year
 * @returns {Promise<void>} Resolves when the lookup finishes, whether or not it succeeded
 */
function loadHolidays(year) {
  if (holidayCache.has(year)) return Promise.resolve();
  if (pendingLoads.has(year)) return pendingLoads.get(year);

  const apiUrl = process.env.STAT_HOLIDAY_API || DEFAULT_STAT_HOLIDAY_API;

  const load = axios
    .get(apiUrl, { params: { year, optional: true }, timeout: 5000 })
    .then((response) => {
      const holidays = response.data?.province?.holidays;

      if (!Array.isArray(holidays) || !holidays.length) {
        throw new Error("Response has no holidays");
      }

      holidayCache.set(
        year,
        new Set(
          holidays.map((holiday) => holiday.observedDate || holiday.date),
        ),
      );
    })
    .catch((error) => {
      console.error(
        `Unable to load ${year} statutory holidays from ${apiUrl}. ` +
          "Email reminders will only skip weekends for that year until the holidays load.",
        error.message,
      );
    })
    .finally(() => {
      pendingLoads.delete(year);
    });

  pendingLoads.set(year, load);
  return load;
}

/**
 * Starts loading the current and next year's holidays in the background, so
 * they're usually cached before the first reminder is saved. Doesn't wait for
 * the lookups to finish.
 * @param {Date} [now] Current date and time
 * @returns {void}
 */
function preloadHolidays(now = new Date()) {
  const year = new TZDate(now, BC_TIMEZONE).getFullYear();

  loadHolidays(year);
  loadHolidays(year + 1);
}

/**
 * Adds business days to a date in BC time using only the holidays already
 * cached. Starts loading any uncached years in the background.
 * @param {Date} fromDate Starting date and time
 * @param {number} days Number of business days to add
 * @param {Set<number>} missingYears Collects the years that weren't cached
 * @returns {string} Resulting BC date as "yyyy-MM-dd"
 */
function countBusinessDays(fromDate, days, missingYears) {
  let date = new TZDate(fromDate, BC_TIMEZONE);
  let remaining = days;

  while (remaining > 0) {
    date = addDays(date, 1);

    if (!isWeekend(date)) {
      const year = date.getFullYear();

      if (!holidayCache.has(year)) {
        missingYears.add(year);
        loadHolidays(year);
      }

      if (!holidayCache.get(year)?.has(format(date, "yyyy-MM-dd"))) {
        remaining--;
      }
    }
  }

  return format(date, "yyyy-MM-dd");
}

/**
 * Waits for holiday lookups to finish, for up to the given time. The lookups
 * keep running in the background after the wait ends.
 * @param {Array<number>} years Years to wait for
 * @param {number} maxWaitMs Maximum time to wait in milliseconds
 * @returns {Promise<void>} Resolves when the lookups finish or the time runs out
 */
async function waitForHolidays(years, maxWaitMs) {
  let timer;

  await Promise.race([
    Promise.all(years.map(loadHolidays)),
    new Promise((resolve) => {
      timer = setTimeout(resolve, maxWaitMs);
    }),
  ]);
  clearTimeout(timer);
}

/**
 * Adds business days to a date in BC time, skipping weekends and BC public
 * service holidays. If a year's holidays aren't cached yet, waits up to
 * SAVE_WAIT_MS for them to load; after that, only weekends are skipped for
 * that year and the lookup finishes in the background.
 * @param {Date} fromDate Starting date and time
 * @param {number} days Number of business days to add
 * @returns {Promise<string>} Resulting BC date as "yyyy-MM-dd"
 */
async function addBCBusinessDays(fromDate, days) {
  const missingYears = new Set();
  const result = countBusinessDays(fromDate, days, missingYears);

  if (!missingYears.size) return result;

  await waitForHolidays([...missingYears], SAVE_WAIT_MS);

  // Recount with whatever loaded. Any newly needed year loads in the background.
  return countBusinessDays(fromDate, days, new Set());
}

/**
 * Clears the cached holiday lists. Used by tests.
 * @returns {void}
 */
function clearHolidayCache() {
  holidayCache.clear();
  pendingLoads.clear();
}

export { addBCBusinessDays, loadHolidays, preloadHolidays, clearHolidayCache };
