// This script creates DateRangeAnnual entries based on existing Publishable, Season, and DateRange data in the database.
// It ensures that each DateRangeAnnual is created only if it does not already exist, preventing duplicates.

import "../../env.js";

import {
  Publishable,
  Park,
  Season,
  DateRange,
  DateType,
  DateRangeAnnual,
} from "../../models/index.js";
import { Op } from "sequelize";
import { fetchAllModels } from "../../strapi-sync/sync.js";
import { getStrapiModelData } from "../../strapi-sync/utils.js";

export async function createDateRangeAnnualEntries() {
  const transaction = await DateRangeAnnual.sequelize.transaction();
  // fetch all models from Strapi
  const strapiData = await fetchAllModels();
  // get park-operation data from Strapi
  const parkOperationData = getStrapiModelData(strapiData, "park-operation");

  try {
    // get dateType "Operating"
    const operatingDateType = await DateType.findOne({
      where: { name: "Operating" },
      transaction,
    });

    if (!operatingDateType) {
      throw new Error('No DateType with name "Operating" found.');
    }

    // get all publishables
    const publishables = await Publishable.findAll({ transaction });

    // get all parks with a publishableId
    const parks = await Park.findAll({
      where: { publishableId: { [Op.ne]: null } },
      transaction,
    });

    // get all dateTypes and build a lookup
    const dateTypes = await DateType.findAll({ transaction });
    const dateTypeNameById = Object.fromEntries(
      dateTypes.map((dateType) => [dateType.id, dateType.name]),
    );

    // build isDateRangeAnnual lookup from parkOperationData
    const parkOperationIsAnnualByOrcs = {};

    for (const parkOperation of parkOperationData.items) {
      console.log("parkOperation", parkOperation);
      const orcs =
        parkOperation.attributes?.protectedArea?.data?.attributes?.orcs;

      if (orcs) {
        parkOperationIsAnnualByOrcs[orcs] =
          parkOperation.attributes.isDateRangeAnnual ?? false;
      }
    }

    // 1 - create dateRangeAnnual for all valid dateRanges, for each publishable
    for (const publishable of publishables) {
      // get all seasons for this publishable
      const seasons = await Season.findAll({
        where: { publishableId: publishable.id },
        include: [
          {
            model: DateRange,
            as: "dateRanges",
            include: [
              {
                model: DateType,
                as: "dateType",
              },
            ],
          },
        ],
        transaction,
      });

      // for each season, for each dateRange, create dateRangeAnnual if not exists
      for (const season of seasons) {
        for (const dateRange of season.dateRanges) {
          const dateTypeId = dateRange.dateTypeId || dateRange.dateType?.id;

          if (!dateTypeId) continue;

          // skip if dateType name is "Tier 1" or "Tier 2" or "Operating"
          const dateTypeName = dateTypeNameById[dateTypeId];

          if (
            dateTypeName === "Tier 1" ||
            dateTypeName === "Tier 2" ||
            dateTypeName === "Operating"
          )
            continue;

          const [created] = await DateRangeAnnual.findOrCreate({
            where: {
              publishableId: publishable.id,
              dateTypeId,
            },
            defaults: {
              publishableId: publishable.id,
              dateTypeId,
            },
            transaction,
          });

          if (created) {
            console.log(
              `Created DateRangeAnnual for publishableId=${publishable.id}, dateTypeId=${dateTypeId}`,
            );
          }
        }
      }
    }

    // 2 - create dateRangeAnnual for "Operating" dateType, for each park
    for (const park of parks) {
      // get isDateRangeAnnual from parkOperationData using orcs
      const isDateRangeAnnual = parkOperationIsAnnualByOrcs[park.orcs] ?? false;

      const [entry, created] = await DateRangeAnnual.findOrCreate({
        where: {
          publishableId: park.publishableId,
          dateTypeId: operatingDateType.id,
        },
        defaults: {
          publishableId: park.publishableId,
          dateTypeId: operatingDateType.id,
          isDateRangeAnnual,
        },
        transaction,
      });

      // if already exists and value differs, update it
      if (!created && entry.isDateRangeAnnual !== isDateRangeAnnual) {
        entry.isDateRangeAnnual = isDateRangeAnnual;
        await entry.save({ transaction });
        console.log(
          `Updated isDateRangeAnnual for publishableId=${park.publishableId} to ${isDateRangeAnnual}`
        );
      } else if (created) {
        console.log(
          `Created DateRangeAnnual for publishableId=${park.publishableId}, dateTypeId=${operatingDateType.id}, isDateRangeAnnual=${isDateRangeAnnual}`
        );
      }
    }

    await transaction.commit();
    console.log("DateRangeAnnual creation complete.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error creating DateRangeAnnual entries:", err);
  }
}

// run directly:
if (process.argv[1] === new URL(import.meta.url).pathname) {
  createDateRangeAnnualEntries().catch((err) => {
    console.error("Unhandled error in createDateRangeAnnualEntries:", err);
    throw err;
  });
}
