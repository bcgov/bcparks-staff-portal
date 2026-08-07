import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faFilter } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import { useParams, useNavigate } from "react-router-dom";
import SubmitPageTable from "@/components/SubmitPageTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import PaginationControls from "@/components/PaginationControls";
import FilterPanel from "@/components/FilterPanel";
import FilterStatus from "@/components/FilterStatus";
import FormPanel from "@/components/FormPanel";
import useAccess from "@/hooks/useAccess";
import * as STATUS from "@/constants/seasonStatus.js";
import RefreshTableContext from "@/contexts/RefreshTableContext";
import {
  checkParkHard,
  checkParkSoft,
  getMatchingAreas,
  getMatchingFeatures,
  shouldShowTiersAndGateSection,
  shouldShowWinterFeeSection,
} from "@/lib/submitPageFilters";
import { groupBy, maxBy } from "lodash-es";

// Build the currentSeason object for a Park from its seasons array.
// Same logic used in the backend for Feature-level currentSeason objects.
function getCurrentSeason(seasons = []) {
  if (!seasons || seasons.length === 0) return { regular: null, winter: null };

  // group seasons by seasonType
  const seasonsByType = groupBy(seasons, "seasonType");

  // find the most recent season (highest operatingYear) for each type
  const regularSeason = seasonsByType.regular
    ? maxBy(seasonsByType.regular, "operatingYear")
    : null;

  const winterSeason = seasonsByType.winter
    ? maxBy(seasonsByType.winter, "operatingYear")
    : null;

  return {
    regular: regularSeason,
    winter: winterSeason,
  };
}

function SubmitPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { hasAnyRole, ROLES } = useAccess();

  // Load Park data for the table
  const { data, loading, error, fetchData } = useApiGet("/parks");

  // Load metadata for each park (park section, management area, access groups) and filter options for the filter panel
  const {
    data: metadataRaw,
    loading: metadataLoading,
    error: metadataError,
  } = useApiGet("/parks/metadata");

  const {
    data: filterOptionsData,
    loading: filterOptionsLoading,
    error: filterOptionsError,
  } = useApiGet("/filter-options");

  // disable filters until Park metadata is loaded
  const metadataLoaded = metadataRaw && !metadataLoading;

  // Build a lookup map from the metadata array: parkId -> { section, managementArea, accessGroups }
  const metadataById = useMemo(
    () =>
      new Map(
        (metadataRaw ?? []).map(({ id, ...metadataFields }) => [
          id,
          metadataFields,
        ]),
      ),
    [metadataRaw],
  );

  // Transform the API response to include currentSeason objects for each Park.
  // Once metadata is available, merge section/managementArea/accessGroups per park.
  const parks = useMemo(
    () =>
      (data ?? []).map((park) => ({
        ...park,

        // Merge in metadata for this park
        ...(metadataById.get(park.id) ?? {}),

        // Build the currentSeason object for this park
        currentSeason: getCurrentSeason(park.seasons),
      })),
    [data, metadataById],
  );

  const filterOptions = useMemo(
    () => filterOptionsData ?? {},
    [filterOptionsData],
  );

  const isApprover = hasAnyRole([ROLES.APPROVER]);

  const statusOptions = useMemo(() => {
    const options = [
      { value: STATUS.REQUESTED.value, label: STATUS.REQUESTED.label },
      {
        value: STATUS.PENDING_REVIEW.value,
        label: STATUS.PENDING_REVIEW.label,
      },
      ...(isApprover
        ? [
            {
              value: STATUS.IS_REVIEW_FILTER.value,
              label: STATUS.IS_REVIEW_FILTER.label,
              indented: true,
            },
            {
              value: STATUS.RS_REVIEW_FILTER.value,
              label: STATUS.RS_REVIEW_FILTER.label,
              indented: true,
            },
          ]
        : []),
      { value: STATUS.APPROVED.value, label: STATUS.APPROVED.label },
      { value: STATUS.PUBLISHED.value, label: STATUS.PUBLISHED.label },
    ];

    return options;
  }, [isApprover]);

  const tableSortOrder = useMemo(
    () =>
      [
        ...(filterOptions?.parkAreaTypes ?? []).map((p) => ({
          rank: p.rank,
          parkAreaTypeNumber: p.parkAreaTypeNumber,
          type: "ParkAreaType",
        })),
        ...(filterOptions?.featureTypes ?? []).map((f) => ({
          rank: f.rank,
          featureTypeNumber: f.featureTypeNumber,
          type: "FeatureType",
        })),
      ].sort((a, b) => a.rank - b.rank),
    [filterOptions],
  );

  // table pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Scroll to top after page changes
  useEffect(() => {
    let cancelled = false;

    // double rAF helps iOS Safari reliability
    const af1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(af1);
    };
  }, [page]);

  function handlePageSizeChange(newPageSize) {
    setPageSize(newPageSize);
    setPage(1);
  }

  // table filter state
  const [filters, setFilters] = useState({
    name: "",
    accessGroups: [],
    status: [],
    sections: [],
    managementAreas: [],
    dateTypes: [],
    featureTypes: [],
    isInReservationSystem: false,
    hasDateNote: false,
  });
  const [formData, setFormData] = useState({});
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const previousIsFormPanelOpenRef = useRef(false);

  // Initialize form from URL parameters if provided
  useEffect(() => {
    if (params.seasonId) {
      // Extract level from pathname (park, park-area, or feature)
      const pathname = window.location.pathname;
      const match = pathname.match(/\/edit\/([^/]+)\/\d+/u);
      const level = match ? match[1] : "";

      if (level) {
        setFormData({
          seasonId: parseInt(params.seasonId, 10),
          level,
        });
        setIsFormPanelOpen(true);
      }
    }
  }, [params.seasonId]);

  // open form panel when the Edit button is clicked
  function formPanelHandler(formDataObj) {
    const regularSeason = formDataObj.currentSeason.regular;
    const winterSeason = formDataObj.currentSeason.winter || {};
    const isWinterSeason = formDataObj.isWinterSeason || false;
    const season = isWinterSeason ? winterSeason : regularSeason;

    const newFormData = {
      seasonId: season.id,
      level: formDataObj.level,
    };

    setFormData(newFormData);
    setIsFormPanelOpen(true);

    // Update URL to match the opened form
    navigate(`/edit/${formDataObj.level}/${season.id}`);
  }

  function resetFilters() {
    setPage(1);
    setFilters({
      name: "",
      accessGroups: [],
      status: [],
      sections: [],
      managementAreas: [],
      dateTypes: [],
      featureTypes: [],
      isInReservationSystem: false,
      hasDateNote: false,
    });
  }

  // Track if any Park-level filters are active
  const parkFiltersActive = useMemo(
    () =>
      filters.name.length ||
      filters.accessGroups.length ||
      filters.sections.length ||
      filters.managementAreas.length ||
      filters.status.length ||
      filters.dateTypes.length ||
      filters.isInReservationSystem,
    [filters],
  );

  const flattenedFilteredResults = useMemo(() => {
    // Flatten the parks, areas, and features into a single "results" array
    // and exclude any areas or features that don't match the filters.

    // Skip all filter logic until metadata has been merged in
    // (section, managementArea, accessGroups)
    if (!metadataLoaded) {
      return parks.map((park) => ({
        ...park,
        matchesFilters: true,
        entityType: "park",
        parkName: park.name,
        showTiersAndGate: true,
        showWinterFee: park.hasWinterFeeDates,
      }));
    }

    const results = parks.flatMap((park) => {
      // If the Park doesn't match the Park-level "hard" filters, exclude it entirely.
      if (parkFiltersActive && !checkParkHard(park, filters)) {
        return [];
      }

      // If the Park doesn't match the Park-level "soft" filters, store that result.
      // We'll continue to check its areas and features to see if any of them match.
      const parkMatch = checkParkSoft(park, filters);

      // Gather matching park areas and features, and add annotations for grouping
      const matchingAreas = getMatchingAreas(park.parkAreas, filters).map(
        (parkArea) => ({
          ...parkArea,
          // Add the park name for grouping
          // (Using the name instead of the ID preserves the sort order
          // when we rebuild the data later for rendering the table)
          parkName: park.name,
          entityType: "parkArea",
        }),
      );

      const matchingFeatures = getMatchingFeatures(park.features, filters).map(
        (feature) => ({
          ...feature,
          parkName: park.name,
          entityType: "feature",
        }),
      );

      // If nothing matches, exclude the entire park
      if (
        !parkMatch &&
        matchingAreas.length === 0 &&
        matchingFeatures.length === 0
      ) {
        return [];
      }

      // If the featureType filter is set, but no Areas/Features match,
      // exclude the park
      if (
        filters.featureTypes.length &&
        matchingAreas.length === 0 &&
        matchingFeatures.length === 0
      ) {
        return [];
      }

      // If the Park or any Areas/Features match,
      // include the Park and the matching Areas/Features
      return [
        {
          ...park,

          // Add a property to the Park object to indicate whether it matches the filters,
          // and add annotations for grouping in the template
          matchesFilters: parkMatch,
          entityType: "park",
          parkName: park.name,

          // Add properties to the Park object to show/hide
          // the "Tiers and gate" / "Winter fee" sections if relevant filters are set.
          showTiersAndGate: shouldShowTiersAndGateSection(park, filters),
          showWinterFee: shouldShowWinterFeeSection(park, filters),
        },

        // Include Areas and Features within the park that match the filters
        ...matchingAreas,
        ...matchingFeatures,
      ];
    });

    return results;
  }, [parks, filters, parkFiltersActive, metadataLoaded]);

  // Count the number of "results" - Parks, Areas, and Features with a status
  const numResults = useMemo(
    () =>
      // Filter out any Parks that don't match the filters;
      // they will not count towards the total results and their season data won't show.
      flattenedFilteredResults.filter(
        (item) => item.entityType !== "park" || item.matchesFilters,
      ).length,
    [flattenedFilteredResults],
  );

  // Format data for rendering in the table
  const tableData = useMemo(() => {
    // Group the flattened results by parkName for rendering in the table
    const groupedByPark = groupBy(flattenedFilteredResults, "parkName");

    // Re-combine the park data into a single Park object,
    // with filtered features and parkAreas
    const formatted = Object.values(groupedByPark).map((parkGroup) => {
      const park = parkGroup.find((entity) => entity.entityType === "park");
      const parkAreas = parkGroup.filter(
        (entity) => entity.entityType === "parkArea",
      );
      const features = parkGroup.filter(
        (entity) => entity.entityType === "feature",
      );

      return {
        ...park,
        parkAreas,
        features,
      };
    });

    return formatted;
  }, [flattenedFilteredResults]);

  const numParks = tableData.length;

  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [key]: value,
      }));

      if (page !== 1) {
        // reset the page to 1 to avoid empty pages
        setPage(1);
      }
    },
    [setFilters, page],
  );

  /**
   * Fetches all the data from the API when something changes.
   * @returns {void}
   */
  function refreshTable() {
    fetchData();
  }

  // Clear URL when form panel closes
  useEffect(() => {
    const wasFormPanelOpen = previousIsFormPanelOpenRef.current;

    if (wasFormPanelOpen && !isFormPanelOpen && params.seasonId) {
      navigate("/", { replace: true });
    }

    previousIsFormPanelOpenRef.current = isFormPanelOpen;
  }, [isFormPanelOpen, params.seasonId, navigate]);

  // Slice the list of parks for pagination
  const pageData = useMemo(() => {
    const start = pageSize * (page - 1);
    const end = start + pageSize;

    return tableData.slice(start, end);
  }, [tableData, page, pageSize]);

  // components
  function ParksTableWrapper() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    if (metadataError) {
      return <p>Error loading parks metadata: {metadataError.message}</p>;
    }

    return (
      <div className="paginated-table">
        <div className="mb-3">
          <RefreshTableContext.Provider value={{ refreshTable }}>
            <SubmitPageTable
              data={pageData}
              onResetFilters={resetFilters}
              formPanelHandler={formPanelHandler}
              sortOrder={tableSortOrder}
            />
          </RefreshTableContext.Provider>
        </div>

        <PaginationControls
          totalItems={numParks}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          pageSizeLabel="Parks per page"
        />
      </div>
    );
  }

  // "filter by status" dropdown
  function StatusFilter() {
    function handleStatusInput(value, metadata = {}) {
      const { changedValue, checked } = metadata;
      const HQ = STATUS.PENDING_REVIEW.value;
      const IS = STATUS.IS_REVIEW_FILTER.value;
      const RS = STATUS.RS_REVIEW_FILTER.value;
      const next = new Set(value);

      if (!isApprover) {
        updateFilter("status", [...next]);
        return;
      }

      if (changedValue === HQ) {
        if (checked) {
          next.add(HQ);
          next.add(IS);
          next.add(RS);
        } else {
          next.delete(HQ);
          next.delete(IS);
          next.delete(RS);
        }
      }

      if (changedValue === IS || changedValue === RS) {
        const hasIS = next.has(IS);
        const hasRS = next.has(RS);

        if (hasIS || hasRS) {
          next.add(HQ);
        } else {
          next.delete(HQ);
        }
      }

      updateFilter("status", [...next]);
    }

    return (
      <MultiSelect
        options={statusOptions}
        onInput={(value, metadata) => {
          setPage(1);
          handleStatusInput(value, metadata);
        }}
        value={filters.status}
        disabled={!metadataLoaded}
      >
        Filter by status{" "}
        {filters.status.length > 0 && `(${filters.status.length})`}
      </MultiSelect>
    );
  }

  // "clear filters" button
  function ClearFilters() {
    return (
      <button
        type="button"
        onClick={resetFilters}
        className="btn text-link text-decoration-underline align-self-end d-block"
      >
        Clear filters
      </button>
    );
  }

  return (
    <div className="container">
      <div className="page dates-management">
        <div className="table-filters row mb-4">
          <div className="col-lg-3 col-md-6 col-12 mb-2 mb-md-0">
            <label htmlFor="parkName" className="form-label">
              Park name
            </label>

            <div className="input-with-append">
              <input
                type="text"
                className="form-control input-search"
                id="parkName"
                placeholder="Search by park name"
                value={filters.name}
                onChange={(e) => {
                  setPage(1);
                  updateFilter("name", e.target.value);
                }}
                disabled={!metadataLoaded}
              />
              <FontAwesomeIcon
                className="append-content"
                icon={faMagnifyingGlass}
              />
            </div>
          </div>

          <div className="col-12 col-md-auto d-flex">
            <div className="me-2">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <StatusFilter />
            </div>

            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="btn btn-outline-primary align-self-end me-2"
              disabled={!metadataLoaded}
            >
              <FontAwesomeIcon icon={faFilter} className="me-1" />
              All filters
            </button>
          </div>
        </div>

        <FilterStatus
          activeFilters={filters}
          filteredCount={numResults}
          ClearFilters={ClearFilters}
          updateFilter={updateFilter}
        />

        <ParksTableWrapper />

        <FormPanel
          show={isFormPanelOpen}
          setShow={setIsFormPanelOpen}
          formData={formData}
          onDataUpdate={refreshTable}
        />

        <FilterPanel
          show={showFilterPanel}
          setShow={setShowFilterPanel}
          filters={filters}
          updateFilter={updateFilter}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          filterOptionsError={filterOptionsError}
          statusFilter={<StatusFilter />}
          ClearFilters={ClearFilters}
          filteredCount={numResults}
        />
      </div>
    </div>
  );
}

export default SubmitPage;
