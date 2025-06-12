import {
  FeatureType,
  Feature,
  Dateable,
  DateType,
  Season,
  DateRange,
} from "../models/index.js";
import { createModel } from "./utils.js";
import { Op } from "sequelize";
import * as STATUS from "../constants/seasonStatus.js";

export async function createMissingDatesAndSeasons() {
  const [seasons, dateTypes, winterFeatureType, features] = await Promise.all([
    // get all seasons for 2025 and 2024
    Season.findAll({
      attributes: ["id", "operatingYear", "parkId", "featureTypeId"],
      where: {
        operatingYear: {
          [Op.in]: [2024, 2025],
        },
      },
    }),
    DateType.findAll(),
    FeatureType.findOne({
      attributes: ["id", "name"],
      where: { name: "Winter fee" },
    }),
    Feature.findAll({
      attributes: [
        "id",
        "name",
        "strapiId",
        "parkId",
        "featureTypeId",
        "hasReservations",
        "hasWinterFeeDates",
      ],
      include: [
        {
          model: Dateable,
          as: "dateable",
          attributes: ["id"],
          include: [
            {
              model: DateRange,
              as: "dateRanges",
              attributes: [
                "id",
                "startDate",
                "endDate",
                "seasonId",
                "dateTypeId",
              ],
            },
          ],
        },
      ],
      where: {
        active: true,
      },
    }),
  ]);

  const seasons2024 = seasons.filter((season) => season.operatingYear === 2024);
  const seasons2025 = seasons.filter((season) => season.operatingYear === 2025);

  const seasonMap2024 = new Map(
    seasons2024.map((season) => [
      `${season.parkId}-${season.featureTypeId}`,
      season,
    ]),
  );

  const seasonMap = new Map(
    seasons2025.map((season) => [
      `${season.parkId}-${season.featureTypeId}`,
      season,
    ]),
  );

  const dateTypeMap = new Map(
    dateTypes.map((dateType) => [dateType.name, dateType]),
  );

  const datesToCreate = [];

  // Helper function to get or create a season
  async function getOrCreateSeason(parkId, featureTypeId) {
    const key = `${parkId}-${featureTypeId}`;

    if (!seasonMap.has(key)) {
      // create season right away becase we need the id
      const newSeason = await createModel(Season, {
        status: STATUS.REQUESTED,
        readyToPublish: true,
        parkId,
        featureTypeId,
        operatingYear: 2025,
      });

      seasonMap.set(key, newSeason);
    }
    return seasonMap.get(key);
  }

  for (const feature of features) {
    const key = `${feature.parkId}-${feature.featureTypeId}`;

    // get 2024 season
    const season2024 = seasonMap2024.get(key);

    if (season2024) {
      const season = await getOrCreateSeason(
        feature.parkId,
        feature.featureTypeId,
      );

      // existing dates for this feature-season
      const existingDateTypes = new Set(
        feature.dateable.dateRanges
          .filter((dateRange) => dateRange.seasonId === season.id)
          .map((dateRange) => dateRange.dateTypeId),
      );

      // add missing operation dates
      if (!existingDateTypes.has(dateTypeMap.get("Operation")?.id)) {
        datesToCreate.push({
          startDate: null,
          endDate: null,
          dateTypeId: dateTypeMap.get("Operation").id,
          dateableId: feature.dateable.id,
          seasonId: season.id,
        });
      }

      // add missing reservation dates
      if (
        feature.hasReservations &&
        !existingDateTypes.has(dateTypeMap.get("Reservation")?.id)
      ) {
        datesToCreate.push({
          startDate: null,
          endDate: null,
          dateTypeId: dateTypeMap.get("Reservation").id,
          dateableId: feature.dateable.id,
          seasonId: season.id,
        });
      }
    }

    // add winter fee seasons
    if (feature.hasWinterFeeDates) {
      const winterKey = `${feature.parkId}-${winterFeatureType.id}`;

      // get 2024 winter season
      const winterSeason2024 = seasonMap2024.get(winterKey);

      if (winterSeason2024) {
        const winterSeason = await getOrCreateSeason(
          feature.parkId,
          winterFeatureType.id,
        );

        const existingWinterDates = feature.dateable.dateRanges.filter(
          (dateRange) => dateRange.seasonId === winterSeason.id,
        );

        if (existingWinterDates.length === 0) {
          datesToCreate.push({
            startDate: null,
            endDate: null,
            dateTypeId: dateTypeMap.get("Winter fee").id,
            dateableId: feature.dateable.id,
            seasonId: winterSeason.id,
          });
        }
      }
    }
  }

  if (datesToCreate.length > 0) {
    await DateRange.bulkCreate(datesToCreate);
  }
}
