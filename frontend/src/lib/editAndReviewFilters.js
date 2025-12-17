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
      !park.currentSeason ||
      !filters.status.includes(park.currentSeason.status)
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
      // If currentSeason is missing or none of the statuses match, filter out
      if (
        !parkArea.currentSeason ||
        !filters.status.includes(parkArea.currentSeason.status)
      ) {
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
      if (!feature.currentSeason) return false;

      // If none of the statuses match, filter out
      if (!filters.status.includes(feature.currentSeason.status)) {
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
