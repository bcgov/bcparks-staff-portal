import { Router } from "express";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  SeasonChangeLog,
  User,
  Campground,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import { Op, Sequelize } from "sequelize";
import _ from "lodash";

const router = Router();

// Look up the winter fees "season" by its ID
router.get(
  "/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    // Get IDs related to the winter fees season
    const winterSeasonDetails = await Season.findByPk(seasonId, {
      attributes: ["id", "operatingYear", "status", "readyToPublish"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name", "icon"],
        },
        {
          model: Park,
          as: "park",
          attributes: ["id", "name", "orcs"],
        },
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
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!winterSeasonDetails) {
      const error = new Error("Winter fee season not found");

      error.status = 404;
      throw error;
    }

    const parkId = winterSeasonDetails.park.id;
    const winterFeeFeatureTypeId = winterSeasonDetails.featureType.id;
    const currentYear = winterSeasonDetails.operatingYear;
    const previousYear = currentYear - 1;

    // Get all the Park's Seasons for the operating year and the previous year
    const seasonIdRows = await Season.findAll({
      attributes: ["id", "operatingYear"],

      where: {
        parkId,

        // @TODO: filter on a flag, TBD: "hasWinterFees"

        // Fetch this operating year,  and the previous year
        operatingYear: {
          [Op.in]: [currentYear, previousYear],
        },
      },

      order: [[Sequelize.col("featureType.name"), "ASC"]],

      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name", "icon"],

          include: [
            {
              model: Feature,
              as: "features",
              attributes: ["id", "name", "featureTypeId", "dateableId"],
              where: {
                parkId,
                active: true,
              },
              required: false,

              include: [
                {
                  model: Campground,
                  as: "campground",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    // Split the season IDs into winter and non-winter
    const { winterSeasons = [], nonWinterSeasons = [] } = _.groupBy(
      seasonIdRows,
      (row) =>
        row.featureType.id === winterFeeFeatureTypeId
          ? "winterSeasons"
          : "nonWinterSeasons",
    );

    // Split the non-winter season Ids into current and previous years
    const { currentSeasons = [], previousSeasons = [] } = _.groupBy(
      nonWinterSeasons,
      (row) =>
        row.operatingYear === currentYear
          ? "currentSeasons"
          : "previousSeasons",
    );
    const currentSeasonIds = currentSeasons.map((row) => row.id);
    const previousSeasonIds = previousSeasons.map((row) => row.id);
    const currentWinterSeasonId = Number(seasonId);
    const previousWinterSeasonId = winterSeasons
      .map((row) => row.id)
      .find((id) => id !== currentWinterSeasonId);

    // Get dates for all the current and previous (non-winter) seasons
    const dateableIds = nonWinterSeasons.flatMap((row) =>
      row.featureType.features.map((feature) => feature.dateableId),
    );
    const dateRanges = await DateRange.findAll({
      where: {
        dateableId: {
          [Op.in]: dateableIds,
        },
        seasonId: {
          [Op.in]: [
            currentWinterSeasonId,
            previousWinterSeasonId,
            ...currentSeasonIds,
            ...previousSeasonIds,
          ],
        },
      },

      include: [
        {
          model: DateType,
          as: "dateType",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    // Organize the features into the FeatureType->Campground->Feature hierarchy
    const featureTypes = currentSeasons.map((season) => {
      // Attach date ranges to features
      const features = season.featureType.features.map((feature) => {
        const featureDateRanges = dateRanges.filter(
          (dateRange) => dateRange.dateableId === feature.dateableId,
        );

        // Group date ranges into current and previous seasons
        const groupedSeasonDates = _.groupBy(featureDateRanges, (dateRange) => {
          if (
            [currentWinterSeasonId, ...currentSeasonIds].includes(
              dateRange.seasonId,
            )
          ) {
            return "currentSeasonDates";
          }

          return "previousSeasonDates";
        });

        return {
          ...feature.toJSON(),

          // Make sure the grouped dates object has both keys
          dateRanges: {
            currentSeasonDates: [],
            previousSeasonDates: [],
            ...groupedSeasonDates,
          },
        };
      });

      // Group features by campground
      const campgrounds = _.groupBy(
        features,
        (feature) => feature.campground?.name ?? "All sites",
      );

      return {
        id: season.featureType.id,
        name: season.featureType.name,
        icon: season.featureType.icon,
        campgrounds,
      };
    });

    res.json({
      name: `${currentYear} – ${currentYear + 1}`,
      id: currentWinterSeasonId,
      operatingYear: currentYear,
      featureTypes,
      changeLogs: winterSeasonDetails.changeLogs,
      park: winterSeasonDetails.park,
      status: winterSeasonDetails.status,
      readyToPublish: winterSeasonDetails.readyToPublish,
    });
  }),
);

export default router;
