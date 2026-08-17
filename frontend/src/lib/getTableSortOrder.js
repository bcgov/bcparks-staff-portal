export default function getTableSortOrder(filterOptions = {}) {
  return [
    ...(filterOptions.parkAreaTypes ?? []).map((parkAreaType) => ({
      rank: parkAreaType.rank,
      parkAreaTypeNumber: parkAreaType.parkAreaTypeNumber,
      type: "ParkAreaType",
    })),
    ...(filterOptions.featureTypes ?? []).map((featureType) => ({
      rank: featureType.rank,
      featureTypeNumber: featureType.featureTypeNumber,
      type: "FeatureType",
    })),
  ].sort((a, b) => a.rank - b.rank);
}
