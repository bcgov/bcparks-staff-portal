import { Router } from "express";
import { Sequelize } from "sequelize";
import asyncHandler from "express-async-handler";
import { writeToString } from "@fast-csv/format";
import _ from "lodash";
import { format, parse as parseDate } from "date-fns";
import { TZDate } from "@date-fns/tz";

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
import * as DATE_TYPE from "../../constants/dateType.js";
import * as SEASON_TYPE from "../../constants/seasonType.js";

const router = Router();

// Define the column names as constants.
// Use this to match values to columns and print the column header row.
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
  UPDATE_TIME: "Last updated",
  UPDATE_USER: "Last updated by",
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
 * Formats a date string as "Weekday, Month Day, Year"
 * @param {string} date parseable date string (e.g., "2023-07-15")
 * @returns {string} Formatted date string, or empty string if date is falsy
 */
function formatDate(date) {
  if (!date) return "";
  return format(date, "EEEE, MMMM d, yyyy");
}

/**
 * Formats a changelog date in BC timezone with a date format suitable for Excel (yyyy-MM-dd HH:mm:ss)
 * @param {string|Date} date parseable date string (ISO 8601)
 * @returns {string} Formatted date string, or empty string if date is falsy
 */
function formatChangeLogDate(date) {
  if (!date) return "";

  // Convert to BC time zone
  const bcDate = new TZDate(date, "America/Vancouver");

  return format(bcDate, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Converts a 24-hour time string to 12-hour format with AM/PM.
 * @param {string|undefined} time24Hour A time string in "HH:mm:ss" format (e.g., "22:00:00")
 * @returns {string} Formatted time string in 12-hour format (e.g., "10:00 PM") or empty string if undefined
 */
function formatTime(time24Hour) {
  if (!time24Hour) return "";

  const parsedTime = parseDate(time24Hour, "HH:mm:ss", new Date());

  return format(parsedTime, "h:mm a");
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
 * @returns {Park|null} the park associated with the date range, or null if not found
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

  // Park seasons: use special logic to determine the value
  // If inReservationSystem is false in the database,
  // fall back to checking for Winter/T1/T2 dates as a workaround for incomplete data.
  // (Same logic as the "BC Parks Reservations" box on the frontend Park season form)
  const {
    inReservationSystem,
    hasTier1Dates,
    hasTier2Dates,
    hasWinterFeeDates,
  } = season.park;

  return (
    inReservationSystem || hasTier1Dates || hasTier2Dates || hasWinterFeeDates
  );
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

/**
 * Gets the feature type for a given season.
 * @param {Season} season The season to get the feature type for,
 * with its associated Feature or ParkArea details
 * @returns {string} The name of the feature type or an empty string
 */
function getFeatureTypeForSeason(season) {
  // For Feature Seasons, return the Feature's type
  if (season.feature) {
    return season.feature.featureType.name;
  }

  // For ParkArea Seasons, return the type of the first Feature in the ParkArea
  if (season.parkArea?.features?.length) {
    return season.parkArea.features[0].featureType.name;
  }

  // Return an empty string if not applicable (e.g., Park seasons)
  return "";
}

/**
 * Returns the Feature associated with a DateRange, or null if not applicable.
 * @param {DateRange} dateRange The DateRange with its season details
 * @returns {Feature|null} The Feature or null if not applicable
 */
function getFeatureForDateRange(dateRange) {
  // For Feature Seasons, return the Feature
  if (dateRange.season.feature) {
    return dateRange.season.feature;
  }

  // For ParkArea Seasons, find the Feature that this DateRange applies to
  if (dateRange.season.parkArea?.features?.length) {
    // Return Feature in the ParkArea with the matching Dateable ID for this DateRange
    const dateRangeFeature = dateRange.season.parkArea.features.find(
      (feature) => feature.dateableId === dateRange.dateableId,
    );

    if (dateRangeFeature) {
      return dateRangeFeature;
    }
  }

  // Return null if not applicable (e.g., Park seasons)
  return null;
}

/**
 * Calculates the GateDetail display values for a DateRange.
 * @param {DateRange} dateRange The DateRange object
 * @param {Object} gateDetail The GateDetail object from the season
 * @param {DateRangeAnnual|undefined} annualData The DateRangeAnnual for this DateRange
 * @returns {Object} Object containing gate start time, end time, and same every year values
 */
function getGateDisplayValues(dateRange, gateDetail, annualData) {
  const isGateType =
    dateRange.dateType.strapiDateTypeId === DATE_TYPE.PARK_GATE_OPEN;
  const hasGate = gateDetail?.hasGate === true;

  let gateStartTime = "";
  let gateEndTime = "";
  let sameEveryYear = "";

  if (hasGate) {
    gateStartTime = gateDetail?.gateOpensAtDawn
      ? "Opens at dawn"
      : formatTime(gateDetail?.gateOpenTime);

    gateEndTime = gateDetail?.gateClosesAtDusk
      ? "Closes at dusk"
      : formatTime(gateDetail?.gateCloseTime);

    // Only show isDateRangeAnnual if hasGate is true AND it's a gate type
    if (isGateType) {
      sameEveryYear = formatBoolean(annualData?.isDateRangeAnnual);
    }
  }

  return {
    isGateType,
    hasGate,
    gateStartTime,
    gateEndTime,
    sameEveryYear,
  };
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

    const PARK_ATTRIBUTES = [
      "id",
      "name",
      "orcs",
      "managementAreas",
      "inReservationSystem",
      "hasTier1Dates",
      "hasTier2Dates",
      "hasWinterFeeDates",
    ];

    // Query for all DateRanges for the given operating year
    const dateRanges = await DateRange.findAll({
      attributes: ["id", "startDate", "endDate", "dateableId", "dateTypeId"],

      include: [
        // Only include dates in a season for the given year
        {
          model: Season,
          as: "season",
          attributes: [
            "id",
            "operatingYear",
            "status",
            "readyToPublish",
            "seasonType",
          ],

          where: { operatingYear },
          required: true,

          include: [
            // Direct park association
            {
              model: Park,
              as: "park",
              attributes: PARK_ATTRIBUTES,
              required: false,
            },

            // ParkArea with its park and features
            {
              model: ParkArea,
              as: "parkArea",
              attributes: ["id", "name", "inReservationSystem"],
              required: false,
              where: {
                active: true,
              },

              include: [
                {
                  model: Park,
                  as: "park",
                  attributes: PARK_ATTRIBUTES,
                  required: true,
                },

                // Include the feature types to display as the "parkArea type"
                {
                  model: Feature,
                  as: "features",
                  attributes: [
                    "id",
                    "name",
                    "dateableId",
                    "strapiFeatureId",
                    "hasReservations",
                  ],
                  required: false,
                  where: {
                    active: true,
                  },

                  include: [
                    {
                      model: FeatureType,
                      as: "featureType",
                      attributes: ["id", "name"],
                      required: true,
                    },
                  ],
                },
              ],
            },

            // Feature with its park
            {
              model: Feature,
              as: "feature",
              attributes: [
                "id",
                "name",
                "strapiFeatureId",
                "hasReservations",
                "inReservationSystem",
              ],
              required: false,

              where: {
                active: true,
              },

              include: [
                {
                  model: Park,
                  as: "park",
                  attributes: PARK_ATTRIBUTES,
                  required: true,
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
              attributes: [
                "id",
                "hasGate",
                "gateOpenTime",
                "gateCloseTime",
                "gateOpensAtDawn",
                "gateClosesAtDusk",
              ],
              required: false,
            },

            // Season changelogs with User details and any "internal notes"
            {
              model: SeasonChangeLog,
              as: "changeLogs",
              attributes: ["id", "notes", "createdAt"],

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
          attributes: ["id", "strapiDateTypeId", "name"],
          required: true,
        },
      ],

      order: [
        // Sort the included season.changeLogs by createdAt to show newest notes first
        [
          { model: Season, as: "season" },
          { model: SeasonChangeLog, as: "changeLogs" },
          "createdAt",
          "DESC",
        ],
      ],
    });

    const dateRangeAnnuals = await getDateRangeAnnualsMap();

    const rows = dateRanges
      // Format into a flat array for CSV output
      .map((dateRange) => {
        const { season } = dateRange;
        const { gateDetail } = season;
        const park = getPark(season);

        // Skip this row if park is null (no valid park association)
        if (!park) {
          console.log("No park found for season ID:", season.id);
          return null;
        }

        const annualData = dateRangeAnnuals.get(
          `${dateRange.dateableId}-${dateRange.dateTypeId}`,
        );

        // Get the most recent changelog entry for update time
        const latestChangeLog = season.changeLogs.at(0);

        // Get the Feature for this DateRange, if there is one
        const feature = getFeatureForDateRange(dateRange);

        // Get the GateDetail display values
        const {
          isGateType,
          hasGate,
          gateStartTime,
          gateEndTime,
          sameEveryYear: gateSameEveryYear,
        } = getGateDisplayValues(dateRange, gateDetail, annualData);

        // Get the final sameEveryYear value
        // For gate (operating) date type, use the value from getGateDisplayValues
        // For other date types, always show the isDateRangeAnnual value
        const sameEveryYear = isGateType
          ? gateSameEveryYear
          : formatBoolean(annualData?.isDateRangeAnnual);

        // Skip this row if this is a gate type and hasGate is false
        if (isGateType && !hasGate) {
          return null;
        }

        // Skip reservation dates if feature has hasReservations=false
        if (
          dateRange.dateType.name === "Reservation" &&
          feature?.hasReservations === false
        ) {
          return null;
        }

        // @TODO: Delete this when FCFS logic is revised
        // Skip FCFS dates
        if (dateRange.dateType.name === "First come, first served") {
          return null;
        }

        // Skip non-winter fee dates for winter seasons
        if (
          season.seasonType === SEASON_TYPE.WINTER &&
          dateRange.dateType.strapiDateTypeId !== DATE_TYPE.WINTER_FEE
        ) {
          return null;
        }

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
          [colNames.FEATURE]: feature?.name ?? "",
          [colNames.FEATURE_ID]: feature?.strapiFeatureId ?? "",
          [colNames.FEATURE_TYPE]: getFeatureTypeForSeason(season),
          [colNames.OPERATING_YEAR]: season.operatingYear,
          [colNames.DATE_TYPE]: dateRange.dateType.name,
          [colNames.START_DATE]: formatDate(dateRange.startDate),
          [colNames.END_DATE]: formatDate(dateRange.endDate),
          [colNames.SAME_EVERY_YEAR]: sameEveryYear,
          [colNames.HAS_GATE]: formatBoolean(hasGate),
          [colNames.GATE_START_TIME]: gateStartTime,
          [colNames.GATE_END_TIME]: gateEndTime,
          [colNames.IN_BCP_RESERVATION_SYSTEM]: formatBoolean(
            getInReservationSystem(season),
          ),
          [colNames.STATUS]: season.status,
          [colNames.READY_TO_PUBLISH]: formatBoolean(season.readyToPublish),
          [colNames.UPDATE_TIME]: formatChangeLogDate(
            latestChangeLog?.createdAt,
          ),
          [colNames.UPDATE_USER]: latestChangeLog?.user.name ?? "",

          // Show the internal notes from changeLogs, if any
          // Filter out changelogs with no notes and concatenate the rest with line breaks
          [colNames.INTERNAL_NOTES]: season.changeLogs
            .filter((changeLog) => changeLog.notes?.trim())
            .map(formatChangeLog)
            .join("\n"),
        };
      })
      .filter(Boolean);

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
