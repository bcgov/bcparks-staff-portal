// Database values for feature types
// Stored as the `featureTypeId` field in Strapi,
// and `strapiFeatureTypeId` in the DOOT FeatureTypes table.

export const ANCHORAGE = 1;
export const BACKCOUNTRY = 2;
export const BOAT_LAUNCH = 3;
export const CABIN = 4;
export const DOCK = 5;
export const FRONTCOUNTRY_CAMPGROUND = 6;
export const GROUP_CAMPGROUND = 7;
export const HOT_SPRING = 8;
export const HUT = 9;
export const MARINE_ACCESSIBLE_CAMPING = 10;
export const MOORING_BUOY = 11;
export const PICNIC_AREA = 12;
export const PICNIC_SHELTER = 13;
export const RESORT = 14;
export const SHELTER = 15;
export const TRAIL = 16;
export const WALK_IN_CAMPING = 17;
export const WILDERNESS_CAMPING = 18;
export const WINTER_CAMPING = 19;
export const UNKNOWN = -1; // New feature types are sorted last by default.

export const SORT_ORDER = [
  FRONTCOUNTRY_CAMPGROUND,
  CABIN,
  WALK_IN_CAMPING,
  WINTER_CAMPING,
  GROUP_CAMPGROUND,
  RESORT,
  BACKCOUNTRY,
  MARINE_ACCESSIBLE_CAMPING,
  HUT,
  SHELTER,
  WILDERNESS_CAMPING,
  PICNIC_AREA,
  PICNIC_SHELTER,
  BOAT_LAUNCH,
  HOT_SPRING,
  DOCK,
  MOORING_BUOY,
  ANCHORAGE,
  TRAIL,
  UNKNOWN,
];
