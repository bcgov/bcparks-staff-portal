import { Op } from "sequelize";
import { Router } from "express";
import _ from "lodash";
import {
  Park,
  Season,
  FeatureType,
  Publishable,
  DateRange,
  DateType,
  Feature,
  ParkArea,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

// Functions
function getParkStatus(seasons) {
  // @TODO: fix this
  console.log("getParkStatus", seasons);
  if (!seasons) return "requested";

  // if any season has status==requested, return requested
  // else if any season has status==pending review, return pending review
  // else if any season has status==approved, return approved
  // if all seasons have status==on API, return on API

  const requested = seasons.some((s) => s.status === "requested");

  if (requested) {
    return "requested";
  }

  const pendingReview = seasons.some((s) => s.status === "pending review");

  if (pendingReview) {
    return "pending review";
  }

  const approved = seasons.some((s) => s.status === "approved");

  if (approved) {
    return "approved";
  }

  const onAPI = seasons.some((s) => s.status === "on API");

  if (onAPI) {
    return "on API";
  }

  return null;
}

// group dateRanges by date type name then by year
// e.g. {Operation: {2024: [...], 2025: [...]}, Winter: {2024: [...], 2025: [...]}, ...}
function groupDateRangesByTypeAndYear(dateRanges) {
  // filter out invalid dateRanges
  const validRanges = dateRanges.filter(
    (dateRange) => dateRange.dateType && dateRange.startDate,
  );

  // group by dateType name
  return _.mapValues(
    _.groupBy(validRanges, (dateRange) => dateRange.dateType.name),
    (ranges) =>
      _.groupBy(ranges, (dateRange) =>
        new Date(dateRange.startDate).getFullYear(),
      ),
  );
}

// build a date range output object
function buildDateRangeObject(dateRange) {
  return {
    id: dateRange.id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dateType: dateRange.dateType
      ? {
          id: dateRange.dateType.id,
          name: dateRange.dateType.name,
        }
      : null,
  };
}

// build a season output object
function buildSeasonOutput(matchedSeason) {
  return {
    id: matchedSeason.id,
    publishableId: matchedSeason.publishableId,
    featureTypeId: matchedSeason.featureTypeId,
    status: matchedSeason.status,
    operatingYear: matchedSeason.operatingYear,
    readyToPublish: matchedSeason.readyToPublish,
  };
}

// build feature output object
function buildFeatureOutput(feature, allDateRanges, parkSeasons) {
  // get date ranges for park.feature
  // filter allDateRanges by feature.dateableId
  const featureDateRanges = allDateRanges
    .filter((dateRange) => dateRange.dateableId === feature.dateableId)
    .map(buildDateRangeObject);

  // get season for park.feature
  // filter park.seasons by feature.publishableId
  // backwards compatibility - filter park.seasons by feature.featureType.publishableId
  const featureSeasons = parkSeasons?.filter(
    (parkSeason) =>
      parkSeason.publishableId === feature.publishableId ||
      (feature.featureType &&
        feature.featureType.publishableId &&
        parkSeason.publishableId === feature.featureType.publishableId),
  );

  return {
    id: feature.id,
    dateableId: feature.dateableId,
    publishableId: feature.publishableId,
    parkAreaId: feature.parkAreaId,
    name: feature.name,
    inReservationSystem: feature.inReservationSystem,
    featureType: {
      id: feature.featureType.id,
      publishableId: feature.featureType.publishableId,
      name: feature.featureType.name,
    },
    status: getParkStatus(featureSeasons),
    groupedDateRanges: groupDateRangesByTypeAndYear(featureDateRanges),
  };
}

const MIN_YEAR_TEMP = 2024;

const itemDates = {
  model: Season,
  as: "seasons",
  attributes: [
    "id",
    "publishableId",
    "featureTypeId",
    "status",
    "readyToPublish",
    "operatingYear",
  ],
  // required: true,
  // filter seasons with operatingYear >= minYear
  where: {
    operatingYear: {
      [Op.gte]: MIN_YEAR_TEMP,
    },
  },
  include: [
    {
      model: Publishable,
      as: "publishable",
      attributes: ["id"],
      // include: [
      //   {
      //     model: FeatureType,
      //     as: "featureType",
      //     attributes: ["id", "name"],
      //   },
      // ],
    },
    {
      model: DateRange,
      as: "dateRanges",
      attributes: ["id", "dateableId", "startDate", "endDate"],
      include: [
        {
          model: DateType,
          as: "dateType",
          attributes: ["id", "name"],
        },
      ],
    },
  ],
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 1;

    const parks = await Park.findAll({
      attributes: [
        "id",
        "dateableId",
        "publishableId",
        "orcs",
        "name",
        "managementAreas",
        "inReservationSystem",
      ],
      include: [
        // Publishable Features that aren't part of a ParkArea
        {
          model: Feature,
          as: "features",
          where: {
            parkAreaId: null,
          },
          required: false,
          attributes: [
            "id",
            "dateableId",
            "publishableId",
            "parkAreaId",
            "name",
            "inReservationSystem",
          ],
          include: [
            {
              model: FeatureType,
              as: "featureType",
              attributes: ["id", "publishableId", "name"],
            },
            // Publishable and Dates for the Feature
            itemDates,
          ],
        },

        // Park areas
        // {
        //   model: ParkArea,
        //   as: "parkAreas",
        //   attributes: ["id", "dateableId", "publishableId", "name"],

        //   include: [
        //     // Features that are part of the ParkArea
        //     {
        //       model: Feature,
        //       as: "features",
        //       attributes: [
        //         "id",
        //         "dateableId",
        //         "publishableId",
        //         "parkAreaId",
        //         "name",
        //         "inReservationSystem",
        //       ],
        //       include: [
        //         {
        //           model: FeatureType,
        //           as: "featureType",
        //           attributes: ["id", "publishableId", "name"],
        //         },
        //       ],
        //     },

        //     // Publishable for the ParkArea
        //     {
        //       model: Publishable,
        //       as: "publishable",
        //       attributes: ["id"],
        //       include: [
        //         {
        //           model: FeatureType,
        //           as: "featureType",
        //           attributes: ["id", "name"],
        //         },
        //       ],
        //     },
        //   ],
        // },

        // Publishable Seasons for the Park itself
        // itemDates,
      ],
      // order: [
      //   // ["name", "ASC"],
      //   // [{ model: ParkArea, as: "parkAreas" }, "name", "ASC"],
      //   // [{ model: Feature, as: "features" }, "name", "ASC"],
      // ],
    });

    const output = parks.map((park) => {
      const allDateRanges = _.flatMap(
        park.seasons,
        (season) => season.dateRanges,
      );

      // get date ranges for park
      // filter allDateRanges by park.dateableId
      const parkDateRanges = allDateRanges
        .filter((dateRange) => dateRange.dateableId === park.dateableId)
        .map(buildDateRangeObject);

      return {
        id: park.id,
        dateableId: park.dateableId,
        publishableId: park.publishableId,
        name: park.name,
        orcs: park.orcs,
        section: park.managementAreas.map((area) => area.section),
        managementArea: park.managementAreas.map((area) => area.mgmtArea),
        inReservationSystem: park.inReservationSystem,
        status: getParkStatus(park.seasons), //
        groupedDateRanges: groupDateRangesByTypeAndYear(parkDateRanges),
        features: park.features.map((feature) =>
          buildFeatureOutput(feature, allDateRanges, park.seasons),
        ),
        parkAreas: park.parkAreas?.map((parkArea) => {
          // get date ranges for park.parkArea
          // filter allDateRanges by parkArea.dateableId
          const parkAreaDateRanges = allDateRanges
            .filter((dateRange) => dateRange.dateableId === parkArea.dateableId)
            .map(buildDateRangeObject);

          // get features for park.parkArea
          // filter park.features by parkArea.id
          const parkAreaFeatures = park.features
            .filter((parkFeature) => parkFeature.parkAreaId === parkArea.id)
            .map((parkFeature) =>
              buildFeatureOutput(parkFeature, allDateRanges, park.seasons),
            );

          // add featureType to parkArea if all features have the same featureType
          let featureType = null;

          if (
            parkAreaFeatures.length > 0 &&
            parkAreaFeatures.every(
              (parkAreaFeature) =>
                parkAreaFeature.featureType &&
                parkAreaFeature.featureType.id ===
                  parkAreaFeatures[0].featureType.id,
            )
          ) {
            featureType = { ...parkAreaFeatures[0].featureType };
          }

          // get season for park.parkArea
          // filter park.seasons by parkArea.publishableId
          // backwards compatibility - filter park.seasons by parkArea.featureType.publishableId

          const parkAreaSeasons = park.seasons.filter(
            (parkSeason) =>
              parkSeason.publishableId === parkArea.publishableId ||
              (featureType &&
                featureType.publishableId &&
                parkSeason.publishableId === featureType.publishableId),
          );

          return {
            id: parkArea.id,
            dateableId: parkArea.dateableId,
            publishableId: parkArea.publishableId,
            name: parkArea.name,
            features: parkAreaFeatures,
            ...(featureType && { featureType }),
            status: getParkStatus(parkAreaSeasons),
            groupedDateRanges: groupDateRangesByTypeAndYear(parkAreaDateRanges),
          };
        }),
        seasons: park.seasons?.map((season) => ({
          id: season.id,
          publishableId: season.publishableId,
          operatingYear: season.operatingYear,
          status: season.status,
          featureType: {
            id: season.publishable.featureType?.id,
            name: season.publishable.featureType?.name,
          },
          readyToPublish: season.readyToPublish,
          dateRanges: season.dateRanges.map(buildDateRangeObject),
        })),
        readyToPublish: park.seasons?.every((season) => season.readyToPublish),
      };
    });

    // Return all rows
    res.json(output);
  }),
);

export default router;
