// This script creates or updates DateType records based on data from date-types.js

import "../../env.js";
import { DateType } from "../../models/index.js";
import { dateTypesData } from "./date-types.js";

export async function createDateTypes(transaction = null) {
  let localTransaction = transaction;
  let createdTransaction = false;

  if (!localTransaction) {
    localTransaction = await DateType.sequelize.transaction();
    createdTransaction = true;
  }

  try {
    for (const entry of dateTypesData) {
      // determine boolean fields based on level array
      const {
        name,
        level,
        startDateLabel,
        endDateLabel,
        description,
        strapiId,
      } = entry;
      const parkLevel = level?.includes("park") || false;
      const featureLevel = level?.includes("feature") || false;
      const parkAreaLevel = level?.includes("parkArea") || false;

      // find an existing DateType
      let dateType = await DateType.findOne({
        where: { name, parkLevel, featureLevel, parkAreaLevel },
        transaction: localTransaction,
      });

      // create or update DateType
      if (!dateType) {
        dateType = await DateType.create(
          {
            name,
            startDateLabel,
            endDateLabel,
            description,
            parkLevel,
            featureLevel,
            parkAreaLevel,
            strapiId,
          },
          { transaction: localTransaction },
        );
      } else {
        dateType.startDateLabel = startDateLabel;
        dateType.endDateLabel = endDateLabel;
        dateType.description = description;
        dateType.parkLevel = parkLevel;
        dateType.featureLevel = featureLevel;
        dateType.parkAreaLevel = parkAreaLevel;
        dateType.strapiId = strapiId;
        await dateType.save({ transaction: localTransaction });
      }

      console.log(`Created/Updated DateType: ${dateType.name}`);
    }

    if (createdTransaction) {
      await localTransaction.commit();
    }
    console.log("All DateTypes created or updated successfully.");
  } catch (err) {
    if (createdTransaction && localTransaction) {
      await localTransaction.rollback();
    }
    console.error("Error creating or updating DateTypes:", err);
    throw err;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    try {
      await createDateTypes();
    } catch (err) {
      console.error("Failed to create or update DateTypes:", err);
      throw err;
    }
  })();
}
