import { Router } from "express";
import { Op, Sequelize } from "sequelize";
import asyncHandler from "express-async-handler";
import { writeToString } from "@fast-csv/format";
import _ from "lodash";
import { format as formatTz } from "date-fns-tz";
import { parse as parseDate } from "date-fns";

import {
  Park,
  Season,
  FeatureType,
  Feature,
  ParkArea,
  DateType,
  DateRange,
  SeasonChangeLog,
  User,
  DateRangeAnnual,
  GateDetail,
} from "../../models/index.js";

const router = Router();

// Define the column names as constants.
// Use this to print the column header row.
const colNames = {
  SECTION: "Section",
  MGMT_AREA: "Management area",
  ORCS: "ORCS",
  PARK_NAME: "Park name",
  AREA: "Area",
  FEATURE: "Feature",
  FEATURE_ID: "Feature ID",
  FEATURE_TYPE: "Feature type",
  OPERATING_YEAR: "Operating year",
  DATE_TYPE: "Date type",
  START_DATE: "Start date",
  END_DATE: "End date",
  SAME_EVERY_YEAR: "Same every year",
  HAS_GATE: "Has Gate",
  GATE_START_TIME: "Gate start time",
  GATE_END_TIME: "Gate end time",
  IN_BCP_RESERVATION_SYSTEM: "In BC Parks Reservation system",
  STATUS: "Status",
  READY_TO_PUBLISH: "Ready to publish",
  INTERNAL_NOTES: "Internal notes",
};

// Get options for the export form
router.get(
  "/options",
  asyncHandler(async (req, res) => {
    const years = (
      await Season.findAll({
        attributes: [
          [
            Sequelize.fn("DISTINCT", Sequelize.col("operatingYear")),
            "operatingYear",
          ],
        ],

        order: [[Sequelize.col("operatingYear"), "ASC"]],
      })
    ).map((year) => ({
      label: year.operatingYear.toString(),
      value: year.operatingYear,
    }));

    res.json({
      years,
      featureTypes: [],
      dateTypes: [],
    });
  }),
);

/**
 * Returns a string with the note, author and email address
 * @param {Object} changeLog A change log object
 * @param {Object} changeLog.user The user who made the change with name string
 * @param {string} changeLog.notes The notes associated with the change
 * @returns {string} Formatted change log string
 */
function formatChangeLog(changeLog) {
  const user = changeLog.user;
  const notes = changeLog.notes;
  const formatted = `${user.name}: ${notes}`;

  return formatted;
}

/**
 * Formats a UTC date string as "Weekday, Month Day, Year"
 * @param {string} ISODate UTC date in ISO format
 * @returns {string} Formatted date string
 */
function formatDate(ISODate) {
  if (!ISODate) return "";
  return formatTz(new Date(ISODate), "EEEE, MMMM d, yyyy", { timeZone: "UTC" });
}

/**
 * Converts a 24-hour time string to 12-hour format with AM/PM.
 * @param {string|undefined} time24Hour A time string in "HH:mm:ss" format (e.g., "22:00:00")
 * @returns {string} Formatted time string in 12-hour format (e.g., "10:00 PM") or empty string if undefined
 */
function formatTime(time24Hour) {
  if (!time24Hour) return "";

  const parsedTime = parseDate(time24Hour, "HH:mm:ss", new Date());

  return formatTz(parsedTime, "h:mm a");
}

/**
 * Formats a boolean value for display as "Yes" or "No".
 * Return an empty string for non-boolean inputs.
 * @param {boolean|undefined} value The value to format
 * @returns {string} The formatted boolean string
 */
function formatBoolean(value) {
  // Return an empty string if the value is undefined or other non-boolean
  if (typeof value !== "boolean") return "";

  return value ? "Yes" : "No";
}

/**
 * Returns the park associated with a date range from
 * its Feature, ParkArea, or direct Park association.
 * @param {Season} season The date range to get the park for
 * @returns {Park} the park associated with the date range
 */
function getPark(season) {
  // ParkArea seasons: return the ParkArea's Park details
  if (season.parkArea) return season.parkArea.park;

  // Feature seasons: return the Feature's Park details
  if (season.feature) return season.feature.park;

  // Park seasons: return the Park details directly
  return season.park;
}

/**
 * Returns whether a season is in the reservation system.
 * @param {Season} season The season to check,
 * with its associated publishable Park, ParkArea, or Feature details
 * @returns {boolean} true if the season is in the reservation system, false otherwise
 */
function getInReservationSystem(season) {
  // ParkArea seasons: return the ParkArea's inReservationSystem value
  if (season.parkArea) return season.parkArea.inReservationSystem;

  // Feature seasons: return the Feature's inReservationSystem value
  if (season.feature) return season.feature.inReservationSystem;

  // Park seasons: return the Park's inReservationSystem value
  return season.park.inReservationSystem;
}

/**
 * Returns a Map of all DateRangeAnnual records from the DB,
 * keyed by dateableId and dateTypeId for lookups in a DateRange loop.
 * @returns {Promise<Map<string, DateRangeAnnual>>} - Promise resolving to a Map of DateRangeAnnual records
 */
async function getDateRangeAnnualsMap() {
  const dateRangeAnnuals = await DateRangeAnnual.findAll({});

  return new Map(
    dateRangeAnnuals.map((dateRangeAnnual) => [
      `${dateRangeAnnual.dateableId}-${dateRangeAnnual.dateTypeId}`,
      dateRangeAnnual,
    ]),
  );
}

// Export all dates for a given operatingYear to CSV
router.get(
  "/csv",
  asyncHandler(async (req, res) => {
    // Cast query param values as numbers
    const operatingYear = Number(req.query.year);

    if (isNaN(operatingYear)) {
      const error = new Error("Invalid operating year");

      error.status = 400;
      throw error;
    }

    // Query for all DateRanges for the given operating year
    const dateRanges = await DateRange.findAll({
      include: [
        // Only include dates in a season for the given year
        {
          model: Season,
          as: "season",

          where: { operatingYear },
          required: true,

          include: [
            // Direct park association
            {
              model: Park,
              as: "park",
              required: false,
            },

            // ParkArea with its park
            {
              model: ParkArea,
              as: "parkArea",
              required: false,

              include: [
                {
                  model: Park,
                  as: "park",
                  required: false,
                },
              ],
            },

            // Feature with its park
            {
              model: Feature,
              as: "feature",
              required: false,

              where: {
                active: true,
              },

              include: [
                {
                  model: Park,
                  as: "park",
                  required: false,
                },

                {
                  model: FeatureType,
                  as: "featureType",
                  attributes: ["id", "name"],
                  required: true,
                },
              ],
            },

            // Gate details for this Publishable
            {
              model: GateDetail,
              as: "gateDetail",
              required: false,
            },

            // Season changelogs with "internal notes"
            {
              model: SeasonChangeLog,
              as: "changeLogs",
              attributes: ["id", "notes", "createdAt"],
              // Filter out empty notes

              where: {
                notes: {
                  [Op.ne]: "",
                },
              },
              required: false,

              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "email"],
                },
              ],
            },
          ],
        },
        // dateType with name
        {
          model: DateType,
          as: "dateType",
          attributes: ["id", "name"],
          required: true,
        },
      ],
    });

    const dateRangeAnnuals = await getDateRangeAnnualsMap();

    const rows = dateRanges
      // Filter out incomplete date ranges
      .filter((dateRange) => dateRange.startDate && dateRange.endDate)
      // Format into a flat array for CSV output
      .map((dateRange) => {
        const { season } = dateRange;
        const { gateDetail } = season;
        const park = getPark(season);

        const annualData = dateRangeAnnuals.get(
          `${dateRange.dateableId}-${dateRange.dateTypeId}`,
        );

        return {
          // Get park management area and section names from jsonb field
          [colNames.SECTION]: park.managementAreas
            .map(({ section }) => section.name)
            .join(", "),
          [colNames.MGMT_AREA]: park.managementAreas
            .map(({ mgmtArea }) => mgmtArea.name)
            .join(", "),

          [colNames.ORCS]: park.orcs,
          [colNames.PARK_NAME]: park.name,
          [colNames.AREA]: season.parkArea?.name ?? "",
          [colNames.FEATURE]: season.feature?.name ?? "",
          [colNames.FEATURE_ID]: season.feature?.strapiFeatureId ?? "",
          [colNames.FEATURE_TYPE]: season.feature?.featureType?.name ?? "",
          [colNames.OPERATING_YEAR]: season.operatingYear,
          [colNames.DATE_TYPE]: dateRange.dateType.name,
          [colNames.START_DATE]: formatDate(dateRange.startDate),
          [colNames.END_DATE]: formatDate(dateRange.endDate),
          [colNames.SAME_EVERY_YEAR]: formatBoolean(
            annualData?.isDateRangeAnnual,
          ),
          [colNames.HAS_GATE]: formatBoolean(gateDetail?.hasGate),
          [colNames.GATE_START_TIME]: formatTime(gateDetail?.gateOpenTime),
          [colNames.GATE_END_TIME]: formatTime(gateDetail?.gateCloseTime),
          [colNames.IN_BCP_RESERVATION_SYSTEM]: formatBoolean(
            getInReservationSystem(season),
          ),
          [colNames.STATUS]: season.status,
          [colNames.READY_TO_PUBLISH]: formatBoolean(season.readyToPublish),
          [colNames.INTERNAL_NOTES]: season.changeLogs
            .map(formatChangeLog)
            .join("\n"),
        };
      });

    // Sort results
    const sortedRows = _.sortBy(rows, [
      "Park name",
      "Area",
      "Feature",
      "Date type",
      "Start date",
    ]);

    // Convert to CSV string
    const csv = await writeToString(sortedRows, {
      headers: Object.values(colNames),
      // Write the header row, even if there's no data
      alwaysWriteHeaders: true,
    });

    // Send CSV string as response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Length", Buffer.byteLength(csv));
    res.send(csv);
  }),
);

export default router;
