import "../../env.js";
import _ from "lodash";
import strapiApi from "../../utils/strapiApi.js";
import { Feature } from "../../models/index.js";

export default async function updateOrcsFeatureNumbers(transaction = null) {
  // Get all feature data from Strapi
  const strapiFeatures = await strapiApi.getAllPages(
    "/park-features",
    // We just need the ID and the featureId & orcsFeatureNumber attributes
    { fields: ["featureId", "orcsFeatureNumber"] },
  );

  // Convert to an entities structure of ID pairs for lookups
  const strapiEntities = strapiFeatures.map((feature) => [
    feature.featureId,
    feature.orcsFeatureNumber,
  ]);

  // Count occurrences of each featureId to identify duplicates
  // Any duplicated featureIds would cause problems, so we'll skip them
  const featureIdCounts = _.countBy(strapiEntities, ([featureId]) => featureId);

  // Create a lookup map of featureId to orcsFeatureNumber
  const featureIdMap = new Map(
    // Remove all instances of duplicated featureIds
    strapiEntities.filter((entity) => featureIdCounts[entity[0]] === 1),
  );

  let updateCount = 0;

  try {
    // Fetch all Feature records in the DOOT db
    const dootFeatures = await Feature.findAll({
      attributes: ["id", "strapiFeatureId", "strapiOrcsFeatureNumber"],

      transaction,
    });

    for (const feature of dootFeatures) {
      // Match on featureId to populate the strapiOrcsFeatureNumber
      const orcsFeatureNumber = featureIdMap.get(feature.strapiFeatureId);

      // Skip updating if there's no orcsFeatureNumber from Strapi
      if (!orcsFeatureNumber) continue;

      // Skip updating if the orcsFeatureNumber hasn't changed
      if (feature.strapiOrcsFeatureNumber === orcsFeatureNumber) continue;

      // Update and save the feature record
      feature.strapiOrcsFeatureNumber = orcsFeatureNumber;
      await feature.save({ transaction });

      updateCount += 1;
    }
  } catch (error) {
    console.error("Failed to update strapiOrcsFeatureNumber:", error);
    if (transaction) await transaction.rollback();
    throw error;
  }

  console.log(`Updated ${updateCount} features with strapiOrcsFeatureNumber.`);
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transaction = await Feature.sequelize.transaction();

  try {
    await updateOrcsFeatureNumbers(transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Failed to update strapiOrcsFeatureNumber:", err);
    throw err;
  }
}
