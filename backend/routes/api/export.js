import { Router } from "express";
import { Op, Sequelize } from "sequelize";
import asyncHandler from "express-async-handler";
import { writeToString } from "@fast-csv/format";
import _ from "lodash";
import { format } from "date-fns-tz";

import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  Dateable,
  SeasonChangeLog,
  User,
} from "../../models/index.js";

const router = Router();

// Get options for the export form
router.get(
  "/options",
  asyncHandler(async (req, res) => {
    const featureTypes = FeatureType.findAll({
      attributes: ["id", "name"],
    });

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
    ).map((year) => year.operatingYear);

    res.json({
      years,
      featureTypes: await featureTypes,
    });
  }),
);

// Returns a string with the note, author and email address
function formatChangeLog(changeLog) {
  const user = changeLog.user;
  const notes = changeLog.notes;
  const formatted = `${user.name} (${user.email}): ${notes}`;

  return formatted;
}

/**
 * Formats a UTC date string as "Weekday, Month Day, Year"
 * @param {string} ISODate UTC date in ISO format
 * @returns {string} - Formatted date string
 */
function formatDate(ISODate) {
  return format(new Date(ISODate), "EEEE, MMMM d, yyyy", { timeZone: "UTC" });
}

// Export to csv
router.get(
  "/csv",
  asyncHandler(async (req, res) => {
    const exportType = req.query.type;
    // Cast query param values as numbers
    const operatingYear = +req.query.year;
    const featureTypeIds = req.query.features?.map((id) => +id) ?? [];

    // Update WHERE clause based on query parameters
    const featuresWhere = {
      active: true,
    };

    if (exportType === "bcp-only") {
      featuresWhere.hasReservations = true;
    }

    const featuresData = await Feature.findAll({
      where: featuresWhere,
      attributes: ["id", "name", "hasReservations", "strapiId"],
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id", "name", "orcs", "managementAreas"],
        },
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
          where: {
            id: {
              [Op.in]: featureTypeIds,
            },
          },
        },
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id", "startDate", "endDate"],
              include: [
                {
                  model: Season,
                  as: "season",
                  attributes: [
                    "id",
                    "operatingYear",
                    "readyToPublish",
                    "status",
                  ],
                  where: {
                    operatingYear,
                  },
                  required: true,
                  include: [
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
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    // Flatten data for CSV row format
    const flattened = featuresData.flatMap((feature) =>
      feature.dateable.dateRanges.map((dateRange) => ({
        // get park management area and section names from jsonb field
        Section: feature.park.managementAreas
          .map((m) => m.section.name)
          .join(", "),
        "Management Area": feature.park.managementAreas
          .map((m) => m.mgmtArea.name)
          .join(", "),
        ORCS: feature.park.orcs,
        "Park Name": feature.park.name,
        "Sub-Area": feature.name,
        "Sub-Area Type (Park feature)": feature.featureType.name,
        "Operating Year": dateRange.season.operatingYear,
        "Type of date": dateRange.dateType.name,
        "Start date": formatDate(dateRange.startDate),
        "End date": formatDate(dateRange.endDate),
        Status: dateRange.season.status,
        "Ready to publish": dateRange.season.readyToPublish,
        Notes: dateRange.season.changeLogs.map(formatChangeLog).join("\n"),
      })),
    );

    // Sort results
    const sorted = _.sortBy(flattened, [
      "Park",
      "Feature",
      "Feature Type",
      "Date Type",
      "Start Date",
    ]);

    // Convert to CSV string
    const csv = await writeToString(sorted, { headers: true });

    // Build filename
    const displayType =
      exportType === "bcp-only" ? "BCP reservations only" : "All";
    const filename = `${operatingYear} season - ${displayType} dates.csv`;

    // Send CSV string as response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csv));
    res.send(csv);
  }),
);

export default router;
