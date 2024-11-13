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
  SeasonChangeLog,
  DateChangeLog,
  User,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";
import { Op } from "sequelize";

const router = Router();

function getNewStatusForSeason(season, user) {
  return season.status;
}

router.get(
  "/seasons/:seasonId",
  asyncHandler(async (req, res) => {
    if (!req.params.sendRealData) {
      const data = {
        id: 3,
        operatingYear: 2025,
        status: "not started",
        featureType: {
          id: 1,
          name: "Frontcountry Camping",
        },
        park: {
          id: 1,
          name: "Golen Ears",
          orcs: "1",
        },
        dateTypes: {
          Reservation: {
            id: 2,
            name: "Reservation",
          },
          Operation: {
            id: 1,
            name: "Operation",
          },
        },
        campgrounds: [
          {
            id: 1,
            name: "Alouette Campground",
            features: [
              {
                id: 1,
                name: "Campsites 1-15",
                hasReservations: true,
                campground: {
                  id: 1,
                  name: "Alouette Campground",
                },
                dateable: {
                  id: 1,
                  currentSeasonDates: [
                    {
                      id: 4,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                    {
                      id: 104,
                      seasonId: 3,
                      startDate: "2022-11-01",
                      endDate: "2022-11-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                    {
                      id: 105,
                      seasonId: 3,
                      startDate: "2022-12-05",
                      endDate: "2022-12-15",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                    {
                      id: 3,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                  ],
                  previousSeasonDates: [
                    {
                      id: 2,
                      seasonId: 1,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                    {
                      id: 1,
                      seasonId: 1,
                      startDate: "2022-04-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                  ],
                },
              },
              {
                id: 2,
                name: "Campsites 16-30",
                hasReservations: true,
                campground: {
                  id: 1,
                  name: "Alouette Campground",
                },
                dateable: {
                  id: 2,
                  currentSeasonDates: [
                    {
                      id: 8,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                    {
                      id: 7,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                  ],
                  previousSeasonDates: [
                    {
                      id: 5,
                      seasonId: 1,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                    {
                      id: 6,
                      seasonId: 1,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                  ],
                },
              },
              {
                id: 3,
                name: "Campsites 31-45",
                hasReservations: true,
                campground: {
                  id: 1,
                  name: "Alouette Campground",
                },
                dateable: {
                  id: 3,
                  currentSeasonDates: [
                    {
                      id: 11,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                    {
                      id: 12,
                      seasonId: 3,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                  ],
                  previousSeasonDates: [
                    {
                      id: 9,
                      seasonId: 1,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 1,
                        name: "Operation",
                      },
                    },
                    {
                      id: 10,
                      seasonId: 1,
                      startDate: "2022-05-01",
                      endDate: "2022-09-30",
                      dateType: {
                        id: 2,
                        name: "Reservation",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
        features: [],
      };

      res.json(data);
      return;
    }

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
        {
          model: SeasonChangeLog,
          as: "changeLogs",
          attributes: ["id", "notes", "createdAt"],
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

// save draft (role determined by user)
router.post(
  "/seasons/:seasonId/save/",
  asyncHandler(async (req, res) => {
    const { seasonId } = req.params;
    const { notes, dates, readyToPublish } = req.body;

    // check that this user has permission to edit this season
    // staff or operator that has access to this park

    // create change log (user, timestamp, notes, )

    console.log(seasonId);
    console.log(notes);
    // console.log(dates);

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

    const newStatus = getNewStatusForSeason(season, null);

    // create season change log
    const seasonChangeLog = await SeasonChangeLog.create({
      seasonId,
      userId: 1,
      notes,
      statusOldValue: season.status,
      statusNewValue: newStatus,
      readyToPublishOldValue: season.readyToPublish,
      readyToPublishNewValue: readyToPublish,
    });

    // update season
    Season.update(
      {
        readyToPublish,
        status: newStatus,
      },
      {
        where: {
          id: seasonId,
        },
      },
    );

    dates.forEach(async (date) => {
      if (date.id && date.changed) {
        // get dateRange
        const dateRange = await DateRange.findByPk(date.id);

        // create date change log
        DateChangeLog.create({
          dateRangeId: date.id,
          seasonChangeLogId: seasonChangeLog.id,
          startDateOldValue: dateRange.startDate,
          startDateNewValue: date.startDate,
          endDateOldValue: dateRange.endDate,
          endDateNewValue: date.endDate,
        });

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
      } else if (!date.id) {
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

    res.send("ok");
  }),
);

// submit for review

// approve

// publish

// export to csv

export default router;
