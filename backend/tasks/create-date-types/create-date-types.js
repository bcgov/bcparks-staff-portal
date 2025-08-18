// This script creates or updates DateType records based on data from date-types.js

import "../../env.js";
import { DateType } from "../../models/index.js";
import { dateTypesData } from "./date-types.js";

export async function createDateTypes(transaction = null) {
  try {
    for (const entry of dateTypesData) {
      // determine boolean fields based on level array
      const { name, level, startDateLabel, endDateLabel, description } = entry;
      const parkLevel = level?.includes("park") || false;
      const featureLevel = level?.includes("feature") || false;
      const parkAreaLevel = level?.includes("parkArea") || false;

      // find an existing DateType
      let dateType = await DateType.findOne({
        where: { name, parkLevel, featureLevel, parkAreaLevel },
        transaction,
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
          },
          { transaction },
        );
      } else {
        dateType.startDateLabel = startDateLabel;
        dateType.endDateLabel = endDateLabel;
        dateType.description = description;
        dateType.parkLevel = parkLevel;
        dateType.featureLevel = featureLevel;
        dateType.parkAreaLevel = parkAreaLevel;
        await dateType.save({ transaction });
      }

      console.log(`Created/Updated DateType: ${dateType.name}`);
    }
    await transaction.commit();
    console.log("All DateTypes created or updated successfully.");
  } catch (err) {
    await transaction.rollback();
    console.error("Error creating or updating DateTypes:", err);
    throw err;
  }
}

// run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await DateType.sequelize.transaction();

  createDateTypes(transaction).catch((err) => {
    console.error("Failed to create or update DateTypes:", err);
    throw err;
  });
}
