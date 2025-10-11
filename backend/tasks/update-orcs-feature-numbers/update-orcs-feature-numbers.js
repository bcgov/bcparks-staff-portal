import "../../env.js";
import strapiApi from "../../utils/strapiApi.js";

export default async function updateOrcsFeatureNumbers() {
  // Get all feature data
  const features = await strapiApi.getAllPages(
    "/api/park-features",
    // We just need the ID and the featureId & orcsFeatureNumber attributes
    { fields: ["featureId", "orcsFeatureNumber"] },
  );

  // console.log("test", features);
  // - make a lookup map
  // - match up on featureId to populate the strapiOrcsFeatureNumber
}

// Run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    await updateOrcsFeatureNumbers();
  } catch (err) {
    console.error("Failed to update Orcs feature numbers:", err);
    throw err;
  }
}
