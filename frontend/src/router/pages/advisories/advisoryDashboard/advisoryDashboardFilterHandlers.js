import {
  PARK_FILTER_NAME,
  REGION_FILTER_NAME,
} from "@/constants/advisoryDashboardFilter";

const DISTRICT_FILTER_NAME = "district";

/**
 * Retrieves a page-level filter value from stored filters.
 * @param {Array} storedFilters Array of filter objects containing type, filterName, and filterValue
 * @param {string} filterName Name of the filter to retrieve
 * @param {any} defaultValue Default value if filter not found (default: 0)
 * @returns {any} The filter value or defaultValue if not found
 */
export function getPageFilterValue(
  storedFilters,
  filterName,
  defaultValue = 0,
) {
  return (
    storedFilters.find(
      (obj) => obj.type === "page" && obj.filterName === filterName,
    )?.filterValue ?? defaultValue
  );
}

/**
 * Normalizes filter values to an array, filtering out empty/invalid values.
 * @param {any} filterValue Value to normalize (string, number, array, or empty)
 * @returns {Array} Normalized array of filter values
 */
export function normalizePageFilterValues(filterValue) {
  if (Array.isArray(filterValue)) {
    return filterValue;
  }

  if (
    filterValue === "" ||
    filterValue === 0 ||
    filterValue === null ||
    typeof filterValue === "undefined"
  ) {
    return [];
  }

  return [filterValue];
}

/**
 * Replaces region and park page filters while preserving other filters like district.
 * @param {Array} currentFilters Current array of filter objects
 * @param {Array} regionFilterValue New region filter values
 * @param {Array} parkFilterValue New park filter values
 * @returns {Array} Updated filter array with region and park filters replaced
 */
export function replacePageFilters(
  currentFilters,
  regionFilterValue,
  parkFilterValue,
) {
  const nonRegionAndParkFilters = currentFilters.filter(
    (currentFilter) =>
      !(
        currentFilter.type === "page" &&
        [REGION_FILTER_NAME, PARK_FILTER_NAME].includes(
          currentFilter.filterName,
        )
      ),
  );

  return [
    ...nonRegionAndParkFilters,
    {
      type: "page",
      filterName: REGION_FILTER_NAME,
      filterValue: regionFilterValue,
    },
    {
      type: "page",
      filterName: PARK_FILTER_NAME,
      filterValue: parkFilterValue,
    },
  ];
}

/**
 * Removes a table filter by field name.
 * @param {Array} currentFilters Current array of filter objects
 * @param {string} field Field name of the table filter to remove
 * @returns {Array} Updated filter array with specified table filter removed
 */
export function removeTableFilter(currentFilters, field) {
  return currentFilters.filter(
    (currentFilter) =>
      !(currentFilter.type === "table" && currentFilter.fieldName === field),
  );
}

/**
 * Updates region and park filters in stored filters.
 * @param {Object} params Configuration object
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @param {Array} params.regionFilterValue Region filter values to set
 * @param {Array} params.parkFilterValue Park filter values to set
 * @returns {void}
 */
export function updateRegionAndParkFilters({
  setStoredFilters,
  regionFilterValue,
  parkFilterValue,
}) {
  setStoredFilters((currentFilters) =>
    replacePageFilters(currentFilters, regionFilterValue, parkFilterValue),
  );
}

/**
 * Handles multi-select changes for page-level filters.
 * @param {Object} params Configuration object
 * @param {Array} params.selectedOptions Currently selected filter options
 * @param {string} params.filterName Name of the filter being changed
 * @param {Function} params.setSelectedOptions State setter for selected options
 * @param {Function} params.setSelectedIds State setter for selected IDs
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @returns {void}
 */
export function handlePageMultiSelectChange({
  selectedOptions,
  filterName,
  setSelectedOptions,
  setSelectedIds,
  resetToFirstPage,
  setStoredFilters,
}) {
  const nextSelectedOptions = selectedOptions || [];
  const nextSelectedIds = nextSelectedOptions.map((option) => option.value);

  setSelectedOptions(nextSelectedOptions);
  setSelectedIds(nextSelectedIds);
  resetToFirstPage();

  setStoredFilters((currentFilters) => {
    const nonTargetPageFilters = currentFilters.filter(
      (currentFilter) =>
        !(
          currentFilter.type === "page" &&
          currentFilter.filterName === filterName
        ),
    );

    return [
      ...nonTargetPageFilters,
      {
        type: "page",
        filterName,
        filterValue: nextSelectedIds,
      },
    ];
  });
}

/**
 * Clears district filter or removes a specific district value.
 * @param {Object} params Configuration object
 * @param {any} params.districtValue Specific district value to remove (undefined clears all)
 * @param {Array} params.selectedDistrict Currently selected district options
 * @param {Function} params.setSelectedDistrict State setter for selected districts
 * @param {Function} params.setSelectedDistrictId State setter for selected district IDs
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @returns {void}
 */
export function clearDistrictFilter({
  districtValue,
  selectedDistrict,
  setSelectedDistrict,
  setSelectedDistrictId,
  resetToFirstPage,
  setStoredFilters,
}) {
  if (typeof districtValue !== "undefined") {
    const nextSelectedDistricts = selectedDistrict.filter(
      (district) => district.value !== districtValue,
    );
    const nextSelectedDistrictIds = nextSelectedDistricts.map(
      (district) => district.value,
    );

    setSelectedDistrict(nextSelectedDistricts);
    setSelectedDistrictId(nextSelectedDistrictIds);
    resetToFirstPage();

    setStoredFilters((currentFilters) => {
      const nonDistrictPageFilters = currentFilters.filter(
        (currentFilter) =>
          !(
            currentFilter.type === "page" &&
            currentFilter.filterName === DISTRICT_FILTER_NAME
          ),
      );

      return [
        ...nonDistrictPageFilters,
        {
          type: "page",
          filterName: DISTRICT_FILTER_NAME,
          filterValue: nextSelectedDistrictIds,
        },
      ];
    });

    return;
  }

  setSelectedDistrict([]);
  setSelectedDistrictId([]);
  resetToFirstPage();
  setStoredFilters((currentFilters) => {
    const nonDistrictPageFilters = currentFilters.filter(
      (currentFilter) =>
        !(
          currentFilter.type === "page" &&
          currentFilter.filterName === DISTRICT_FILTER_NAME
        ),
    );

    return [
      ...nonDistrictPageFilters,
      { type: "page", filterName: DISTRICT_FILTER_NAME, filterValue: [] },
    ];
  });
}

/**
 * Clears region filter or removes a specific region value. Clears parks on full clear.
 * @param {Object} params Configuration object
 * @param {any} params.regionValue Specific region value to remove (undefined clears all)
 * @param {Array} params.selectedRegion Currently selected region options
 * @param {Function} params.setSelectedRegion State setter for selected regions
 * @param {Function} params.setSelectedRegionId State setter for selected region IDs
 * @param {Function} params.setSelectedPark State setter for selected parks
 * @param {Function} params.setSelectedParkId State setter for selected park IDs
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @param {Function} params.updateRegionAndParkFiltersFn Function to update region and park filters
 * @returns {void}
 */
export function clearRegionFilter({
  regionValue,
  selectedRegion,
  setSelectedRegion,
  setSelectedRegionId,
  setSelectedPark,
  setSelectedParkId,
  resetToFirstPage,
  setStoredFilters,
  updateRegionAndParkFiltersFn,
}) {
  if (typeof regionValue !== "undefined") {
    const nextSelectedRegions = selectedRegion.filter(
      (region) => region.value !== regionValue,
    );
    const nextSelectedRegionIds = nextSelectedRegions.map(
      (region) => region.value,
    );

    setSelectedRegion(nextSelectedRegions);
    setSelectedRegionId(nextSelectedRegionIds);
    resetToFirstPage();

    setStoredFilters((currentFilters) => {
      const currentParkIds = getPageFilterValue(
        currentFilters,
        PARK_FILTER_NAME,
        [],
      );

      return replacePageFilters(
        currentFilters,
        nextSelectedRegionIds,
        currentParkIds,
      );
    });

    return;
  }

  setSelectedRegion([]);
  setSelectedRegionId([]);
  setSelectedPark([]);
  setSelectedParkId([]);
  resetToFirstPage();
  updateRegionAndParkFiltersFn([], []);
}

/**
 * Clears park filter or removes a specific park value.
 * @param {Object} params Configuration object
 * @param {any} params.parkValue Specific park value to remove (undefined clears all)
 * @param {Array} params.selectedPark Currently selected park options
 * @param {Function} params.setSelectedPark State setter for selected parks
 * @param {Function} params.setSelectedParkId State setter for selected park IDs
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @returns {void}
 */
export function clearParkFilter({
  parkValue,
  selectedPark,
  setSelectedPark,
  setSelectedParkId,
  resetToFirstPage,
  setStoredFilters,
}) {
  if (typeof parkValue !== "undefined") {
    const nextSelectedParks = selectedPark.filter(
      (park) => park.value !== parkValue,
    );
    const nextSelectedParkIds = nextSelectedParks.map((park) => park.value);

    setSelectedPark(nextSelectedParks);
    setSelectedParkId(nextSelectedParkIds);
    resetToFirstPage();

    setStoredFilters((currentFilters) => {
      const currentRegionIds = getPageFilterValue(
        currentFilters,
        REGION_FILTER_NAME,
        [],
      );

      return replacePageFilters(
        currentFilters,
        currentRegionIds,
        nextSelectedParkIds,
      );
    });

    return;
  }

  setSelectedPark([]);
  setSelectedParkId([]);
  resetToFirstPage();
  setStoredFilters((currentFilters) => {
    const currentRegionIds = getPageFilterValue(
      currentFilters,
      REGION_FILTER_NAME,
      [],
    );

    return replacePageFilters(currentFilters, currentRegionIds, []);
  });
}

/**
 * Clears table filter for a specific field.
 * @param {Object} params Configuration object
 * @param {string} params.field Field name of the table filter to clear
 * @param {Function} params.setTableFilterValues State setter for table filter values
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @returns {void}
 */
export function clearTableFilter({
  field,
  setTableFilterValues,
  resetToFirstPage,
  setStoredFilters,
}) {
  setTableFilterValues((prev) => ({ ...prev, [field]: "" }));
  resetToFirstPage();
  setStoredFilters((currentFilters) =>
    removeTableFilter(currentFilters, field),
  );
}

/**
 * Clears the show unpublished filter.
 * @param {Object} params Configuration object
 * @param {Function} params.setShowUnpublished State setter for show unpublished toggle
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @returns {void}
 */
export function clearShowUnpublishedFilter({
  setShowUnpublished,
  resetToFirstPage,
}) {
  setShowUnpublished(false);
  resetToFirstPage();
}

/**
 * Clears all filters (page, table, and unpublished).
 * @param {Object} params Configuration object
 * @param {Function} params.setSelectedDistrict State setter for selected districts
 * @param {Function} params.setSelectedDistrictId State setter for selected district IDs
 * @param {Function} params.setSelectedRegion State setter for selected regions
 * @param {Function} params.setSelectedRegionId State setter for selected region IDs
 * @param {Function} params.setSelectedPark State setter for selected parks
 * @param {Function} params.setSelectedParkId State setter for selected park IDs
 * @param {Function} params.setShowUnpublished State setter for show unpublished toggle
 * @param {Function} params.setTableFilterValues State setter for table filter values
 * @param {Function} params.resetToFirstPage Function to reset pagination to first page
 * @param {Function} params.setStoredFilters State setter for stored filters
 * @param {Array} params.defaultPageFilters Default page filter values to restore
 * @returns {void}
 */
export function clearAllFilters({
  setSelectedDistrict,
  setSelectedDistrictId,
  setSelectedRegion,
  setSelectedRegionId,
  setSelectedPark,
  setSelectedParkId,
  setShowUnpublished,
  setTableFilterValues,
  resetToFirstPage,
  setStoredFilters,
  defaultPageFilters,
}) {
  setSelectedDistrict([]);
  setSelectedDistrictId([]);
  setSelectedRegion([]);
  setSelectedRegionId([]);
  setSelectedPark([]);
  setSelectedParkId([]);
  setShowUnpublished(false);
  setTableFilterValues({});
  resetToFirstPage();
  setStoredFilters(defaultPageFilters);
}
