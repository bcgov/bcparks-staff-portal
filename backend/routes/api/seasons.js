import { Router } from "express";
import {
  Park,
  Season,
  FeatureType,
  Feature,
  DateType,
  DateRange,
  Dateable,
} from "../../models/index.js";
import asyncHandler from "express-async-handler";

const router = Router();

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
      ],
    });

    if (!seasonModel) {
      const error = new Error("Season not found");

      error.status = 404;
      throw error;
    }

    const season = seasonModel.toJSON();

    const parkFeatures = await Feature.findAll({
      where: {
        parkId: season.park.id,
        active: true,
        featureTypeId: season.featureType.id,
      },
      attributes: ["id", "name", "hasReservations"],
      include: [
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
              where: { seasonId: season.id },
            },
          ],
        },
      ],
    });

    const features = parkFeatures.map((feature) => feature.toJSON());

    const output = {
      ...season,
      features,
    };

    res.json(output);
  }),
);

export default router;
