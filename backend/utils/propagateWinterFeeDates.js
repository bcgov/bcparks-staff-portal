// For Winter fee dates collected at the Park level,
// This script will propagate the dates down to the Frontcountry camping Feature and Area levels.

import { Op } from "sequelize";
import _ from "lodash";
import { parseISO, min, max, isBefore } from "date-fns";

import {
  Season,
  Park,
  ParkArea,
  Feature,
  FeatureType,
  DateRange,
  DateType,
} from "../models/index.js";
import { APPROVED } from "../constants/seasonStatus.js";
import consolidateRanges from "./consolidateDateRanges.js";

const FRONTCOUNTRY_CAMPING_TYPE_NAME = "Frontcountry campground";
const WINTER_FEE_DATE_TYPE_NAME = "Winter fee";
const OPERATING_DATE_TYPE_NAME = "Operation";

// START: Helpers - @TODO: maybe move to a separate file

async function getSeasonPark(season, transaction = null) {
  // If the season is a Park season, return it directly
  if (season.park) {
    return season;
  }

  // If the season is an Area season, get the Park details
  if (season.parkArea) {
    return await Park.findByPk(season.parkArea.parkId, { transaction });
  }

  // If the season is a Feature season, get the Park details from the Feature
  if (season.feature) {
    return await Park.findByPk(season.feature.parkId, { transaction });
  }

  throw new Error("Season does not have associated Park details.");
}

function seasonsQueryPart(operatingYear) {
  return {
    model: Season,
    as: "seasons",
    where: { operatingYear },
    required: false,
  };
}

function frontcountryFeaturesQueryPart(featureTypeId) {
  return {
    model: Feature,
    as: "features",
    where: { featureTypeId },
    required: true,
  };
}

async function getAllFrontcountrySeasons(
  park,
  operatingYear,
  transaction = null,
) {
  // Find the FeatureTypeId for "Frontcountry campground"
  const frontcountryType = await FeatureType.findOne({
    where: { name: FRONTCOUNTRY_CAMPING_TYPE_NAME },
    attributes: ["id"],
    transaction,
  });

  if (!frontcountryType) {
    throw new Error("Frontcountry campground FeatureType not found.");
  }

  const FRONTCOUNTRY_CAMPING_TYPE_ID = frontcountryType.id;

  // Get all Seasons in the Park for the operating year
  const parkSeasons = await Park.findByPk(park.id, {
    include: [
      // Park seasons
      seasonsQueryPart(operatingYear),

      // ParkAreas
      {
        model: ParkArea,
        as: "parkAreas",
        include: [
          // Frontcountry camping Features within Areas
          frontcountryFeaturesQueryPart(FRONTCOUNTRY_CAMPING_TYPE_ID),

          // Area seasons
          seasonsQueryPart(operatingYear),
        ],
      },

      // Features directly in the Park, and Features within Areas
      {
        ...frontcountryFeaturesQueryPart(FRONTCOUNTRY_CAMPING_TYPE_ID),

        include: [
          // Feature seasons
          seasonsQueryPart(operatingYear),
        ],
      },
    ],
    transaction,
  });

  // If no season satisfies the criteria, return an empty array
  if (!parkSeasons) return [];

  console.log("parkSeasons:", parkSeasons.toJSON());

  // Return all of the Seasons, organized by level
  return {
    park: parkSeasons.seasons,

    parkArea: parkSeasons.parkAreas.flatMap((parkArea) => parkArea.seasons),

    feature: parkSeasons.features.flatMap((feature) => feature.seasons),
  };
}

async function addWinterFeeDatesToSeasons(
  allSeasons,
  park,
  transaction = null,
) {
  const areaAndFeatureSeasons = [...allSeasons.parkArea, ...allSeasons.feature];

  const winterFeeType = await DateType.findOne({
    attributes: ["id"],
    where: { name: WINTER_FEE_DATE_TYPE_NAME },
    transaction,
  });

  if (!winterFeeType) {
    throw new Error("Winter fee DateType not found.");
  }

  const operatingDateType = await DateType.findOne({
    attributes: ["id"],
    where: { name: OPERATING_DATE_TYPE_NAME },
    transaction,
  });

  if (!operatingDateType) {
    throw new Error("Operating DateType not found.");
  }

  // Get all of the winter dates for the Park level
  const parkWinterDates = await DateRange.findAll({
    where: {
      dateableId: park.dateableId,
      dateTypeId: winterFeeType.id,
    },
    transaction,
  });

  console.log(
    "\n\nparkWinterDates::",
    `(id ${winterFeeType.id})`,
    parkWinterDates,
  );

  const consolidatedWinterDates = consolidateRanges(
    parkWinterDates.map((dateRange) => dateRange.toJSON()),
  );

  console.log("\n\nconsolidatedWinterDates:", consolidatedWinterDates);

  if (!consolidatedWinterDates.length) return false;

  // Find operating dates for every Area and Feature in the Park
  const addedDates = [];

  for (const season of areaAndFeatureSeasons) {
    console.log("\n\n\nloop a season here:", season.toJSON());
    const result = await addWinterFeeDatesForSeason(
      season,
      consolidatedWinterDates,
      winterFeeType.id,
      operatingDateType.id,
      transaction,
    );

    addedDates.push(result);
  }

  return addedDates;
}

// returns an array of date @TODO: jsdocs
function getOverlappingDateRanges(winterDates, operatingDates) {
  console.log("finding overlaps between:");
  console.log("winterDates:", winterDates);
  console.log("operatingDates:", operatingDates);

  const overlaps = _.flatMap(winterDates, (winterRange) => {
    const winterStart = winterRange.startDate;
    const winterEnd = winterRange.endDate;

    // Return an array of overlapping ranges for this winter date range
    const winterOverlaps = operatingDates
      .map((operatingRange) => {
        const operatingStart = operatingRange.startDate;
        const operatingEnd = operatingRange.endDate;

        // Find the latest start date and earliest end date to determine any overlap
        const overlapStart = max([winterStart, operatingStart]);
        const overlapEnd = min([winterEnd, operatingEnd]);

        // Check for overlap (start <= end)
        if (
          isBefore(overlapStart, overlapEnd) ||
          overlapStart.getTime() === overlapEnd.getTime()
        ) {
          return {
            startDate: overlapStart,
            endDate: overlapEnd,
          };
        }

        // If no overlap, return null
        return null;
      })
      .filter(Boolean); // Filter out null values

    return winterOverlaps;
  });

  return overlaps;
}

// @TODO: rename the two similarly-named functions
async function addWinterFeeDatesForSeason(
  season,
  winterDates,
  winterTypeId,
  operatingTypeId,
  transaction,
) {
  console.log("checking season:", season.toJSON());

  // If the season has any winter dates already, skip it
  const existingWinterDates = await DateRange.findAll({
    where: {
      seasonId: season.id,
      dateTypeId: winterTypeId,
    },
    transaction,
  });

  console.log("existingWinterDates:", existingWinterDates);
  if (existingWinterDates.length) {
    console.log(`Season ${season.id} already has winter dates, skipping...`);
    return false;
  }

  // Get operating dates for the season
  const operatingDatesResults = await DateRange.findAll({
    where: {
      seasonId: season.id,
      dateTypeId: operatingTypeId,
    },
    transaction,
  });

  console.log("\n\noperatingDatesResults:", operatingDatesResults);

  if (!operatingDatesResults.length) return false;

  // Group operating dates by dateableId
  const groupedOperatingDates = _.groupBy(
    operatingDatesResults,
    (dateRange) => dateRange.dateableId,
  );

  console.log("\ngroupedOperatingDates:", groupedOperatingDates);

  const foo = _.map(groupedOperatingDates, (dateRanges, dateableId) => {
    console.log("\n\nin map", dateableId, dateRanges);

    // Consolidate the operating date ranges for this dateableId
    const operatingDates = consolidateRanges(
      dateRanges.map((dateRange) => dateRange.toJSON()),
    );

    console.log("\n\noperatingDates:", operatingDates);

    // Get an array of overlapping dates from winterDates and operatingDates
    const overlappingDates = getOverlappingDateRanges(
      winterDates,
      operatingDates,
    );

    console.log("\n\noverlappingDates:", overlappingDates);

    if (!overlappingDates.length) return false;

    // @TODO: create winter dates for overlapping dates
    console.log("add winter date range for overlappingDates for this season");
    console.log("overlappingDates:", overlappingDates);
    return DateRange.bulkCreate(
      overlappingDates.map((dateRange) => ({
        seasonId: season.id,
        dateableId,
        dateTypeId: winterTypeId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })),
      { transaction },
    );
  });

  return Promise.all(foo);
}

// END: Helpers

export async function propagateWinterFeeDates(seasonId, transaction = null) {
  // Get the current Season, along with its Park details
  const season = await Season.findByPk(seasonId, {
    include: [
      // Park details, if it's a Park season
      {
        model: Park,
        as: "park",
      },

      // Area details, if it's an Area season
      {
        model: ParkArea,
        as: "parkArea",
      },

      // Feature details, if it's a Feature season (including Features within Areas)
      {
        model: Feature,
        as: "feature",
      },
    ],
    transaction,
  });

  console.log("season:");
  console.log(season.toJSON());

  // Get the Park details
  const park = await getSeasonPark(season, transaction);
  const operatingYear = season.operatingYear;

  console.log("park:");
  console.log(park.toJSON());

  console.log("operatingYear:", operatingYear);

  // If the Park doesn't have winter fee dates, return false
  if (!park.hasWinterFeeDates) return false;

  // Get all Frontcountry camping Seasons in the Park (Park/Area/Feature) for the operating year
  const allFrontcountrySeasons = await getAllFrontcountrySeasons(
    park,
    operatingYear,
    transaction,
  );

  const combinedFrontcountrySeasons = [
    ...allFrontcountrySeasons.park,
    ...allFrontcountrySeasons.parkArea,
    ...allFrontcountrySeasons.feature,
  ];

  console.log("\n\n\nallParkSeasons:", combinedFrontcountrySeasons.length);

  if (!combinedFrontcountrySeasons.length) return false;

  // Check if all of the frontcountry camping seasons are approved
  const allApproved = combinedFrontcountrySeasons.every(
    (frontcountrySeason) => frontcountrySeason.status === APPROVED,
  );

  console.log(combinedFrontcountrySeasons.map((s) => s.toJSON()));

  if (!allApproved) return false;

  console.log(
    "\n\n\n\nallApproved",
    combinedFrontcountrySeasons.map((s) => s.toJSON()),
  );

  // All seasons are approved, so add winter fee dates to the Feature and Area seasons
  return addWinterFeeDatesToSeasons(allFrontcountrySeasons, park, transaction);
}

// run it for testing
try {
  // await propagateWinterFeeDates(19533); // Park season
  // await propagateWinterFeeDates(19534); // Area season
  // await propagateWinterFeeDates(19535); // Area feature season "All sites"
  const result = await propagateWinterFeeDates(19536); // Feature season "Duncan's test"

  console.log("returned:", result);
} catch (error) {
  console.error("Error propagating winter fee dates:", error);
} finally {
  console.log("Winter fee dates propagation completed.");
}
