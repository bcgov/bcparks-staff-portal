import { Router } from "express";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  Dateable,
  Campground,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

const router = Router();

router.get(
  "/seasons/:seasonId",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;

    const seasonModel = await Season.findByPk(seasonId, {
      attributes: ["id", "operatingYear", "status"],
      include: [
        {
          model: FeatureType,
          as: "featureType",
          attributes: ["id", "name"],
        },
        {
          model: Park,
          as: "park",
          attributes: ["id", "name", "orcs"],
        },
      ],
    });

    if (!seasonModel) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    const season = seasonModel.toJSON();
    const prevSeason = await Season.findOne({
      where: {
        parkId: season.park.id,
        featureTypeId: season.featureType.id,
        operatingYear: season.operatingYear - 1,
      },
      attributes: ["id"],
    });

    // we want to get the features for this season and the previous season
    // seasonsIds will be used to query the date ranges
    const seasonIds = [season.id];

    if (prevSeason) {
      seasonIds.push(prevSeason.id);
    }

    const parkFeatures = await Feature.findAll({
      where: {
        parkId: season.park.id,
        active: true,
        featureTypeId: season.featureType.id,
      },
      attributes: ["id", "name", "hasReservations"],
      include: [
        {
          model: Campground,
          as: "campground",
          attributes: ["id", "name"],
        },
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: ["id", "seasonId", "startDate", "endDate"],
              include: [
                {
                  model: DateType,
                  as: "dateType",
                  attributes: ["id", "name"],
                },
              ],
              where: {
                seasonId: {
                  [Op.or]: seasonIds,
                },
              },
            },
          ],
        },
      ],
    });

    const dateTypes = {};

    const features = parkFeatures.map((featureObj) => {
      const feature = featureObj.toJSON();

      feature.dateable.currentSeasonDates = [];
      feature.dateable.previousSeasonDates = [];

      feature.dateable.dateRanges.forEach((dateRange) => {
        if (!dateTypes[dateRange.dateType.name]) {
          dateTypes[dateRange.dateType.name] = dateRange.dateType;
        }

        if (dateRange.seasonId === season.id) {
          feature.dateable.currentSeasonDates.push(dateRange);
        }

        if (dateRange.seasonId === prevSeason?.id) {
          feature.dateable.previousSeasonDates.push(dateRange);
        }
      });
      delete feature.dateable.dateRanges;
      return feature;
    });

    const campgroundsMap = {};

    features.forEach((feature) => {
      if (feature.campground) {
        if (!campgroundsMap[feature.campground.id]) {
          campgroundsMap[feature.campground.id] = {
            id: feature.campground.id,
            name: feature.campground.name,
            features: [],
          };
        }

        campgroundsMap[feature.campground.id].features.push(feature);
      }
    });

    const campgrounds = Object.values(campgroundsMap);

    const output = {
      ...season,
      dateTypes,
      campgrounds,
      features: features.filter((feature) => !feature.campground),
    };

    res.json(output);
  }),
);

// SAVING FORMS
// - save draft (operator)
// - submit for review (operator)
// - save draft (staff)
// - approve (staff)

// publish (staff)
// export to csv (staff)

// save draft (role determined by user)
router.post(
  "seasons/:seasonId/save",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const { notes, dates } = req.body;

    // check that this user has permission to edit this season
    // staff or operator that has access to this park

    // create change log (user, timestamp, notes, )

    const season = await Season.findByPk(seasonId, {
      include: [
        {
          model: Park,
          as: "park",
          attributes: ["id"],
        },
      ],
    });

    if (!season) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    dates.forEach((date) => {
      if (date.id) {
        // update
        DateRange.update(
          {
            startDate: date.startDate,
            endDate: date.endDate,
          },
          {
            where: {
              id: date.id,
            },
          },
        );
      } else {
        // create
        DateRange.create({
          seasonId,
          dateableId: date.dateableId,
          dateTypeId: date.dateType.id,
          startDate: date.startDate,
          endDate: date.endDate,
        });
      }
    });
  }),
);

// submit for review

// approve

// publish

// export to csv

export default router;
