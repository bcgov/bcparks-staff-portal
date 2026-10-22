import * as DATE_TYPES from "@/apps/dates/constants/dateType.js";
import * as FEATURE_TYPE from "@/apps/dates/constants/featureType.js";
import * as STATUS from "@/constants/seasonStatus.js";

function matchesStatusFilters(season, statusFilters) {
  if (!season || !statusFilters.length) return false;

  const isPendingReviewFilterSelected = statusFilters.includes(
    STATUS.PENDING_REVIEW.value,
  );
  const isIsReviewFilterSelected = statusFilters.includes(
    STATUS.IS_REVIEW_FILTER.value,
  );
  const isRsReviewFilterSelected = statusFilters.includes(
    STATUS.RS_REVIEW_FILTER.value,
  );

  const basicStatuses = statusFilters.filter(
    (status) =>
      status !== STATUS.PENDING_REVIEW.value &&
      status !== STATUS.IS_REVIEW_FILTER.value &&
      status !== STATUS.RS_REVIEW_FILTER.value,
  );

  if (basicStatuses.includes(season.status)) {
    return true;
  }

  // Child filters only apply to seasons in pending review status.
  if (season.status !== STATUS.PENDING_REVIEW.value) {
    return false;
  }

  // If only parent pending is selected, include all pending review seasons.
  if (
    isPendingReviewFilterSelected &&
    !isIsReviewFilterSelected &&
    !isRsReviewFilterSelected
  ) {
    return true;
  }

  // Treat "review" as "still awaiting that team's approval".
  if (
    isIsReviewFilterSelected &&
    season.requiresInformationSvcApproval === true &&
    season.informationSvcApproved !== true
  ) {
    return true;
  }

  if (
    isRsReviewFilterSelected &&
    season.requiresReservationSvcApproval === true &&
    season.reservationSvcApproved !== true
  ) {
    return true;
  }

  return false;
}

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
      (!park.currentSeason.regular ||
        !matchesStatusFilters(park.currentSeason.regular, filters.status)) &&
      // the winter season's status also doesn't match (or there is no winter season)
      (!park.currentSeason.winter ||
        !matchesStatusFilters(park.currentSeason.winter, filters.status))
    ) {
      return false;
    }
  }

  // Filter by date types
  if (
    filters.dateTypes.length &&
    !filters.dateTypes.some((filterDateType) => {
      // check park.hasGate and dateTypes
      if (
        filterDateType.dateTypeNumber === DATE_TYPES.PARK_GATE_OPEN &&
        !park.hasGate
      ) {
        return false;
      }

      // check park.hasTier1Dates, park.hasTier2Dates, park.hasWinterFeeDates, and dateTypes
      if (
        filterDateType.dateTypeNumber === DATE_TYPES.TIER_1 &&
        !park.hasTier1Dates
      ) {
        return false;
      }
      if (
        filterDateType.dateTypeNumber === DATE_TYPES.TIER_2 &&
        !park.hasTier2Dates
      ) {
        return false;
      }

      if (
        filterDateType.dateTypeNumber === DATE_TYPES.WINTER_FEE &&
        !park.hasWinterFeeDates
      ) {
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
      if (
        !matchesStatusFilters(parkArea.currentSeason.regular, filters.status)
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
          filterDateType.dateTypeNumber ===
            DATE_TYPES.BACKCOUNTRY_REGISTRATION &&
          !parkArea.features.some((feature) => feature.hasBackcountryPermits)
        ) {
          return false;
        }

        // Check feature.hasReservations and dateTypes
        if (
          filterDateType.dateTypeNumber === DATE_TYPES.RESERVATION &&
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
          // If the parkArea doesn't have any featureTypes, exclude it from the results
          if (!parkArea.featureTypes.length) return false;

          return parkArea.featureTypes.some(
            (featureType) => featureType.id === filterFeatureType.id,
          );
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
      if (
        !matchesStatusFilters(feature.currentSeason.regular, filters.status)
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
          filterDateType.dateTypeNumber ===
            DATE_TYPES.BACKCOUNTRY_REGISTRATION &&
          !feature.hasBackcountryPermits
        ) {
          return false;
        }

        // Check feature.hasReservations and dateTypes
        if (
          filterDateType.dateTypeNumber === DATE_TYPES.RESERVATION &&
          !feature.hasReservations
        ) {
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
 * Each active filter must match the section (filters are combined with AND).
 * @param {Object} park The park object
 * @param {Object} filters The active filter state
 * @returns {boolean} Whether to show the "Tiers and gate" section on the table
 */
export function shouldShowTiersAndGateSection(park, filters) {
  // If "Feature type" filters are set, hide the section.
  // Tiers and Gate have no applicable feature types.
  if (filters.featureTypes.length) {
    return false;
  }

  // If "Status" filters are set, the park's regular season status must match
  if (
    filters.status.length &&
    !(
      park.currentSeason.regular &&
      matchesStatusFilters(park.currentSeason.regular, filters.status)
    )
  ) {
    return false;
  }

  // If "Date type" filters are set, at least one must apply to this section
  if (
    filters.dateTypes.length &&
    !filters.dateTypes.some(
      (dateType) =>
        // "Park gate open" date type always applies to the "Tiers and gate" section
        dateType.dateTypeNumber === DATE_TYPES.PARK_GATE_OPEN ||
        // Tier dates apply if the park has them
        (park.hasTier1Dates && dateType.dateTypeNumber === DATE_TYPES.TIER_1) ||
        (park.hasTier2Dates && dateType.dateTypeNumber === DATE_TYPES.TIER_2),
    )
  ) {
    return false;
  }

  // When "BCP reservations only" is selected,
  // only show if Tier 1/2 dates are requested for the Park
  if (
    filters.isInReservationSystem &&
    !(park.hasTier1Dates || park.hasTier2Dates)
  ) {
    return false;
  }

  // If no filters are selected, always show the section
  // (Regardless of Tier 1/2 dates, all parks display the "Park gate open" section)
  return true;
}

/**
 * Returns true if the "Winter fee" section should be shown for the given park and filters.
 * Each active filter must match the section (filters are combined with AND).
 * @param {Object} park The park object
 * @param {Object} filters The active filter state
 * @returns {boolean} Whether to show the "Winter fee" section on the table
 */
export function shouldShowWinterFeeSection(park, filters) {
  // If the Park has no winter fee dates, never show the section
  if (!park.hasWinterFeeDates) return false;

  // If "Feature type" filters are set
  if (filters.featureTypes.length) {
    // If "Frontcountry campground" feature type is not selected, hide the section
    // Winter fees only apply to frontcountry campgrounds
    if (
      !filters.featureTypes.some(
        (featureType) =>
          featureType.featureTypeNumber ===
          FEATURE_TYPE.FRONTCOUNTRY_CAMPGROUND,
      )
    ) {
      return false;
    }
  }

  // If "Status" filters are set, the park's winter season status must match
  if (
    filters.status.length &&
    !(
      park.currentSeason.winter &&
      matchesStatusFilters(park.currentSeason.winter, filters.status)
    )
  ) {
    return false;
  }

  // If "Date type" filters are set, "Winter fee" must be one of them
  if (
    filters.dateTypes.length &&
    !filters.dateTypes.some(
      (dateType) => dateType.dateTypeNumber === DATE_TYPES.WINTER_FEE,
    )
  ) {
    return false;
  }

  // "BCP reservations only" doesn't hide "Winter fee" sections,
  // and with no filters selected, the section is always shown
  return true;
}
