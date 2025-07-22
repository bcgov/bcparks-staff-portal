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

// Functions
// clean all DateRangeAnnual entries
async function cleanAllDateRangeAnnuals() {
  try {
    await DateRangeAnnual.destroy({ where: {}, truncate: true });
    console.log("All DateRangeAnnual records deleted.");
  } catch (err) {
    console.error("Error deleting DateRangeAnnual records:", err);
    throw err;
  }
}

// finds dateableId for a given park and "Operating" dateType
// returns the first found dateableId or null if not found.
async function findOperatingDateableId(park, operatingDateType, transaction) {
  const seasons = await Season.findAll({
    where: { publishableId: park.publishableId },
    include: [
      {
        model: DateRange,
        as: "dateRanges",
        where: { dateTypeId: operatingDateType.id },
        required: false,
      },
    ],
    transaction,
  });

  for (const season of seasons) {
    for (const dateRange of season.dateRanges) {
      if (dateRange.dateableId) {
        return dateRange.dateableId;
      }
    }
  }
  return null;
}

export async function createDateRangeAnnualEntries() {
  // TODO: comment this out after initial run
  // clean existing DateRangeAnnual entries
  await cleanAllDateRangeAnnuals();

  const transaction = await DateRangeAnnual.sequelize.transaction();
  // fetch all models from Strapi
  const strapiData = await fetchAllModels();
  // get park-operation data from Strapi
  const parkOperationData = getStrapiModelData(strapiData, "park-operation");

  try {
    // get dateType "Operating"
    const operatingDateType = await DateType.findOne({
      where: { name: "Operating", parkLevel: true },
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

          // skip if dateType name is "Tier 1" or "Tier 2"
          const dateTypeName = dateTypeNameById[dateTypeId];

          if (dateTypeName === "Tier 1" || dateTypeName === "Tier 2") continue;

          const [entry, created] = await DateRangeAnnual.findOrCreate({
            where: {
              publishableId: publishable.id,
              dateableId: dateRange.dateableId,
              dateTypeId,
            },
            defaults: {
              publishableId: publishable.id,
              dateableId: dateRange.dateableId,
              dateTypeId,
            },
            transaction,
          });

          if (!created) {
            // update dateableId if it has changed
            if (entry.dateableId !== dateRange.dateableId) {
              entry.dateableId = dateRange.dateableId;
              await entry.save({ transaction });
              console.log(
                `Updated dateableId for DateRangeAnnual id=${entry.id} to ${dateRange.dateableId}`,
              );
            }
          } else {
            console.log(
              `Created DateRangeAnnual for publishableId=${publishable.id}, dateableId=${dateRange.dateableId}, dateTypeId=${dateTypeId}`,
            );
          }
        }
      }
    }

    // 2 - create dateRangeAnnual for "Operating" dateType, for each park
    for (const park of parks) {
      // get isDateRangeAnnual from parkOperationData using orcs
      const isDateRangeAnnual = parkOperationIsAnnualByOrcs[park.orcs] ?? false;
      const dateableId = await findOperatingDateableId(
        park,
        operatingDateType,
        transaction,
      );

      const [entry, created] = await DateRangeAnnual.findOrCreate({
        where: {
          publishableId: park.publishableId,
          dateableId,
          dateTypeId: operatingDateType.id,
        },
        defaults: {
          publishableId: park.publishableId,
          dateableId,
          dateTypeId: operatingDateType.id,
          isDateRangeAnnual,
        },
        transaction,
      });

      // if already exists and value differs, update it
      if (!created) {
        let updated = false;

        // update isDateRangeAnnual if it has changed
        if (entry.isDateRangeAnnual !== isDateRangeAnnual) {
          entry.isDateRangeAnnual = isDateRangeAnnual;
          updated = true;
        }

        // ensure dateableId is correct
        if (entry.dateableId !== park.dateableId) {
          entry.dateableId = park.dateableId;
          updated = true;
        }

        if (updated) {
          await entry.save({ transaction });
          console.log(
            `Updated DateRangeAnnual for publishableId=${park.publishableId}, dateTypeId=${operatingDateType.id}: isDateRangeAnnual=${isDateRangeAnnual}, dateableId=${dateableId}`,
          );
        }
      } else {
        console.log(
          `Created DateRangeAnnual for publishableId=${park.publishableId}, dateTypeId=${operatingDateType.id}, isDateRangeAnnual=${isDateRangeAnnual}, dateableId=${dateableId}`,
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
