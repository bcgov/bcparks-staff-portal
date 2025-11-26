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
        strapiDateTypeId,
      } = entry;
      const parkLevel = level?.includes("park") || false;
      const featureLevel = level?.includes("feature") || false;
      const parkAreaLevel = level?.includes("parkArea") || false;

      // Skip entries without strapiDateTypeId
      if (!strapiDateTypeId) {
        console.warn(
          `Skipping DateType "${name}" - no strapiDateTypeId provided`,
        );
        continue;
      }

      // Find existing DateType by strapiDateTypeId
      let dateType = await DateType.findOne({
        where: { strapiDateTypeId },
        transaction: localTransaction,
      });

      // Create or update DateType based on strapiDateTypeId
      if (!dateType) {
        // Create new DateType
        dateType = await DateType.create(
          {
            name,
            startDateLabel,
            endDateLabel,
            description,
            parkLevel,
            featureLevel,
            parkAreaLevel,
            strapiDateTypeId,
          },
          { transaction: localTransaction },
        );
        console.log(
          `Created DateType: ${dateType.name} (ID: ${dateType.id}, strapiDateTypeId: ${strapiDateTypeId})`,
        );
      } else {
        // Update existing DateType
        await dateType.update(
          {
            name,
            startDateLabel,
            endDateLabel,
            description,
            parkLevel,
            featureLevel,
            parkAreaLevel,
          },
          { transaction: localTransaction },
        );
        console.log(
          `Updated DateType: ${dateType.name} (ID: ${dateType.id}, strapiDateTypeId: ${strapiDateTypeId})`,
        );
      }
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
