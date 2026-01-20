import * as DATE_TYPES from "@/constants/dateType.js";

/**
 * Checks a Park against the active Park-level "hard" filters.
 * Hard filters completely exclude a park and all its areas/features if they don't match.
 * @param {Object} park The park object to check
 * @param {Object} filters The active filter state
 * @returns {boolean} False if the entire park should be filtered out, true if it should be included for area/feature checks
 */
export function checkParkHard(park, filters) {
  // If a name filter is set, filter out parks that don't match
  if (
    filters.name.length > 0 &&
    !park.name.toLocaleLowerCase().includes(filters.name.toLocaleLowerCase())
  ) {
    return false;
  }

  // Filter by access groups
  // filters.accessGroups is called "Bundle(s)" in the UI and it allows users to
  // filter parks by bundles. It is not for security purposes.
  if (
    filters.accessGroups.length > 0 &&
    !filters.accessGroups.some((group) =>
      park.accessGroups.some((parkGroup) => parkGroup.id === group.id),
    )
  ) {
    return false;
  }

  // Filter by sections
  if (
    filters.sections.length > 0 &&
    !filters.sections.some((section) =>
      park.section.some(
        (parkSection) => parkSection.number === section.sectionNumber,
      ),
    )
  ) {
    return false;
  }

  // Filter by management areas
  if (
    filters.managementAreas.length > 0 &&
    !filters.managementAreas.some((area) =>
      park.managementArea.some(
        (mgmtArea) => mgmtArea.number === area.managementAreaNumber,
      ),
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Checks a Park against the active Park-level "soft" filters.
 * Soft filters only determine whether the park itself matches, but won't exclude it from the results.
 * @param {Object} park The park object to check
 * @param {Object} filters The active filter state
 * @returns {boolean} False if the park doesn't match the soft filters, true otherwise
 */
export function checkParkSoft(park, filters) {
  // Filter by status
  if (filters.status.length) {
    if (
      // Filter out if the regular season status doesn't match, and
      !filters.status.includes(park.currentSeason.regular.status) &&
      // the winter season's status also doesn't match (or there is no winter season)
      (!park.currentSeason.winter ||
        !filters.status.includes(park.currentSeason.winter.status))
    ) {
      return false;
    }
  }

  // Filter by date types
  if (
    filters.dateTypes.length &&
    !filters.dateTypes.some((filterDateType) => {
      // check park.hasGate and dateTypes
      if (filterDateType.name === "Park gate open" && !park.hasGate) {
        return false;
      }

      // check park.hasTier1Dates, park.hasTier2Dates, park.hasWinterFeeDates, and dateTypes
      if (filterDateType.name === "Tier 1" && !park.hasTier1Dates) {
        return false;
      }
      if (filterDateType.name === "Tier 2" && !park.hasTier2Dates) {
        return false;
      }

      if (filterDateType.name === "Winter fee" && !park.hasWinterFeeDates) {
        return false;
      }

      // check park.seasons and dateTypes
      const hasParkDateType = park.seasons.some((season) =>
        season.dateRanges.some(
          (dateRange) => dateRange.dateType.id === filterDateType.id,
        ),
      );

      return hasParkDateType;
    })
  ) {
    return false;
  }

  // Filter by isInReservationSystem
  // Park level: check if it has hasTier1Dates, hasTier2Dates, or hasWinterFeeDates
  if (
    filters.isInReservationSystem &&
    !(park.hasTier1Dates || park.hasTier2Dates || park.hasWinterFeeDates)
  ) {
    return false;
  }

  return true;
}

/**
 * Filters a park's areas based on the active area-level filters.
 * @param {Array} parkAreas Array of park area objects to filter
 * @param {Object} filters The active filter state
 * @returns {Array} Array of park areas that match the filters
 */
export function getMatchingAreas(parkAreas, filters) {
  if (parkAreas.length === 0) return [];

  return parkAreas.filter((parkArea) => {
    if (parkArea.features.length === 0) return false;

    // Filter by status
    if (filters.status.length) {
      if (!parkArea.currentSeason.regular) return false;

      // If none of the statuses match, filter out
      if (!filters.status.includes(parkArea.currentSeason.regular.status)) {
        return false;
      }
    }

    // Filter by date types
    if (
      filters.dateTypes.length &&
      !filters.dateTypes.some((filterDateType) => {
        // Check feature.hasBackcountryPermits and dateTypes
        if (
          filterDateType.name === "Backcountry registration" &&
          !parkArea.features.some((feature) => feature.hasBackcountryPermits)
        ) {
          return false;
        }

        // Check feature.hasReservations and dateTypes
        if (
          filterDateType.name === "Reservation" &&
          !parkArea.features.some((feature) => feature.hasReservations)
        ) {
          return false;
        }

        // Check parkArea.seasons and dateTypes
        const hasParkAreaDateType = parkArea.seasons.some((season) =>
          season.dateRanges.some(
            (dateRange) => dateRange.dateType.id === filterDateType.id,
          ),
        );

        // Check parkAreas.features.seasons and dateTypes
        const hasParkAreaFeatureDateType = parkArea.features.some((feature) =>
          feature.seasons.some((season) =>
            season.dateRanges.some(
              (dateRange) => dateRange.dateType.id === filterDateType.id,
            ),
          ),
        );

        return hasParkAreaDateType || hasParkAreaFeatureDateType;
      })
    ) {
      return false;
    }

    // Filter by feature types
    if (
      filters.featureTypes.length &&
      !filters.featureTypes.some(
        // Check parkAreas.featureTypes
        (filterFeatureType) => {
          // If the parkArea doesn't have a featureType (if its features have varying types),
          // Exclude it from the results
          if (!parkArea.featureType) return false;

          return parkArea.featureType.id === filterFeatureType.id;
        },
      )
    ) {
      return false;
    }

    // Filter by isInReservationSystem
    // Area and feature level: check if it has inReservationSystem
    if (filters.isInReservationSystem && !parkArea.inReservationSystem) {
      return false;
    }

    return true;
  });
}

/**
 * Filters a park's features based on the active feature-level filters.
 * @param {Array} features Array of feature objects to filter
 * @param {Object} filters The active filter state
 * @returns {Array} Array of features that match the filters
 */
export function getMatchingFeatures(features, filters) {
  if (features.length === 0) return [];

  return features.filter((feature) => {
    // Filter by status
    if (filters.status.length) {
      if (!feature.currentSeason.regular) return false;

      // If none of the statuses match, filter out
      if (!filters.status.includes(feature.currentSeason.regular.status)) {
        return false;
      }
    }

    // Filter by date types
    if (
      filters.dateTypes.length &&
      !filters.dateTypes.some((filterDateType) => {
        // Check feature.hasBackcountryPermits and dateTypes
        if (
          filterDateType.name === "Backcountry registration" &&
          !feature.hasBackcountryPermits
        ) {
          return false;
        }

        // Check feature.hasReservations and dateTypes
        if (filterDateType.name === "Reservation" && !feature.hasReservations) {
          return false;
        }

        // Check features.seasons and dateTypes
        const hasFeatureDateType = feature.seasons.some((season) =>
          season.dateRanges.some(
            (dateRange) => dateRange.dateType.id === filterDateType.id,
          ),
        );

        return hasFeatureDateType;
      })
    ) {
      return false;
    }

    // Filter by feature types
    if (
      filters.featureTypes.length &&
      !filters.featureTypes.some(
        (filterFeatureType) =>
          // Check features.featureTypes
          feature.featureType.id === filterFeatureType.id,
      )
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Returns true if the "Tiers and gate" section should be shown for the given park and filters.
 * @param {Object} park The park object
 * @param {Object} filters The active filter state
 * @returns {boolean} Whether to show the "Tiers and gate" section on the table
 */
export function shouldShowTiersAndGateSection(park, filters) {
  // If no filters are selected, always show the section
  // (Regardless of Tier 1/2 dates, all parks display the "Park gate open" section)
  let show = true;

  // If "Feature type" filters are set, hide the section.
  // Tiers and Gate have no applicable feature types.
  if (filters.featureTypes.length) {
    return false;
  }

  // If "Status" filters are set
  if (filters.status.length) {
    // Show section if the park's regular season status matches
    if (filters.status.includes(park.currentSeason.regular.status)) {
      return true;
    }

    // If no relevant date type filters are set,
    // hide the section unless it matches other criteria
    show = false;
  }

  // If "Date type" filters are set
  if (filters.dateTypes.length) {
    // "Park gate open" date type always shows the "Tiers and gate" section
    if (
      filters.dateTypes.some(
        (dateType) => dateType.strapiDateTypeId === DATE_TYPES.PARK_GATE_OPEN,
      )
    ) {
      return true;
    }

    // Show section if park has matching tier dates
    if (
      park.hasTier1Dates &&
      filters.dateTypes.some(
        (dateType) => dateType.strapiDateTypeId === DATE_TYPES.TIER_1,
      )
    ) {
      return true;
    }
    if (
      park.hasTier2Dates &&
      filters.dateTypes.some(
        (dateType) => dateType.strapiDateTypeId === DATE_TYPES.TIER_2,
      )
    ) {
      return true;
    }

    // If no relevant date type filters are set,
    // hide the section unless it matches other criteria
    show = false;
  }

  // When "BCP reservations only" is selected,
  // only show if Tier 1/2 dates are requested for the Park
  if (filters.isInReservationSystem) {
    if (park.hasTier1Dates || park.hasTier2Dates) {
      return true;
    }

    // If the Park has no Tier 1/2 dates, hide the section
    show = false;
  }

  return show;
}

/**
 * Returns true if the "Winter fee" section should be shown for the given park and filters.
 * @param {Object} park The park object
 * @param {Object} filters The active filter state
 * @returns {boolean} Whether to show the "Winter fee" section on the table
 */
export function shouldShowWinterFeeSection(park, filters) {
  // If the Park has no winter fee dates, never show the section
  if (!park.hasWinterFeeDates) return false;

  // If no filters are selected, always show the section
  let show = true;

  // If "Status" filters are set
  if (filters.status.length) {
    // Show section if the park's winter season status matches
    if (filters.status.includes(park.currentSeason.winter.status)) {
      return true;
    }

    // If no relevant date type filters are set,
    // hide the section unless it matches other criteria
    show = false;
  }

  // If "Date type" filters are set
  if (filters.dateTypes.length) {
    // If "Winter fee" date type is selected, show the section
    if (
      filters.dateTypes.some(
        (dateType) => dateType.strapiDateTypeId === DATE_TYPES.WINTER_FEE,
      )
    ) {
      return true;
    }

    // If other date types are selected,
    // hide the section unless it matches other criteria
    show = false;
  }

  // If "Feature type" filters are set
  if (filters.featureTypes.length) {
    // If "Frontcountry campground" feature type is selected, show the section
    if (
      filters.featureTypes.some(
        (featureType) => featureType.name === "Frontcountry campground",
      )
    ) {
      return true;
    }

    // If other feature types are selected,
    // hide the section unless it matches other criteria
    show = false;
  }

  // When "BCP reservations only" is selected, "Winter fee" sections should appear
  if (filters.isInReservationSystem) {
    return true;
  }

  return show;
}
