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
import { getStrapiModelData } from "../../strapi-sync/strapi-data-service.js";
import * as DATE_TYPE from "../../constants/dateType.js"

// Functions
// finds dateableId for a given park and "Park gate open" dateType
// returns the first found dateableId or null if not found.
async function findGateDateableId(park, gateDateType, transaction) {
  const seasons = await Season.findAll({
    where: { publishableId: park.publishableId },
    include: [
      {
        model: DateRange,
        as: "dateRanges",
        where: { dateTypeId: gateDateType.id },
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
  const transaction = await DateRangeAnnual.sequelize.transaction();
  // get park-operation data from Strapi
  const parkOperationData = await getStrapiModelData("park-operation");

  try {
    // get dateType "Park gate open"
    const gateDateType = await DateType.findOne({
      where: { strapiDateTypeId: DATE_TYPE.PARK_GATE_OPEN },
      transaction,
    });

    if (!gateDateType) {
      throw new Error('No DateType with name "Park gate open" found.');
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

    // 2 - create dateRangeAnnual for "Park gate open" dateType, for each park
    for (const park of parks) {
      // get isDateRangeAnnual from parkOperationData using orcs
      const isDateRangeAnnual = parkOperationIsAnnualByOrcs[park.orcs] ?? false;
      const dateableId = await findGateDateableId(
        park,
        gateDateType,
        transaction,
      );

      const [entry, created] = await DateRangeAnnual.findOrCreate({
        where: {
          publishableId: park.publishableId,
          dateableId,
          dateTypeId: gateDateType.id,
        },
        defaults: {
          publishableId: park.publishableId,
          dateableId,
          dateTypeId: gateDateType.id,
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
        if (entry.dateableId !== dateableId) {
          entry.dateableId = dateableId;
          updated = true;
        }

        if (updated) {
          await entry.save({ transaction });
          console.log(
            `Updated DateRangeAnnual for publishableId=${park.publishableId}, dateTypeId=${gateDateType.id}: isDateRangeAnnual=${isDateRangeAnnual}, dateableId=${dateableId}`,
          );
        }
      } else {
        console.log(
          `Created DateRangeAnnual for publishableId=${park.publishableId}, dateTypeId=${gateDateType.id}, isDateRangeAnnual=${isDateRangeAnnual}, dateableId=${dateableId}`,
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
