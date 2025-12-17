import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faFilter } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import useConfirmation from "@/hooks/useConfirmation";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState, useEffect, useCallback } from "react";
import PaginationControls from "@/components/PaginationControls";
import FilterPanel from "@/components/FilterPanel";
import FilterStatus from "@/components/FilterStatus";
import FormPanel from "@/components/FormPanel";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import * as STATUS from "@/constants/seasonStatus.js";
import RefreshTableContext from "@/contexts/RefreshTableContext";
import {
  checkParkHard,
  checkParkSoft,
  getMatchingAreas,
  getMatchingFeatures,
} from "@/lib/editAndReviewFilters";
import { groupBy } from "lodash-es";

function EditAndReview() {
  const { data, loading, error, fetchData } = useApiGet("/parks");
  const {
    data: filterOptionsData,
    loading: filterOptionsLoading,
    error: filterOptionsError,
  } = useApiGet("/filter-options");
  const parks = useMemo(() => data ?? [], [data]);
  const filterOptions = filterOptionsData ?? {};

  const statusOptions = [
    { value: STATUS.REQUESTED.value, label: STATUS.REQUESTED.label },
    { value: STATUS.PENDING_REVIEW.value, label: STATUS.PENDING_REVIEW.label },
    { value: STATUS.APPROVED.value, label: STATUS.APPROVED.label },
    { value: STATUS.PUBLISHED.value, label: STATUS.PUBLISHED.label },
  ];

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
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const modal = useConfirmation();

  // open form panel when the Edit button is clicked
  async function formPanelHandler(formDataObj) {
    const status = formDataObj.currentSeason.status;

    // If the season is already approved, prompt to continue
    if (status === "approved") {
      const proceed = await modal.open(
        "Edit approved dates?",
        "Dates will need to be reviewed again to be approved.",
        "Edit",
        "Cancel",
      );

      // If the user cancels in the confirmation modal, don't open the edit form
      if (!proceed) {
        return;
      }
    }
    // If the season is already published to the CMS, prompt to continue
    else if (status === "published") {
      const proceed = await modal.open(
        "Edit public dates on API?",
        "Dates will need to be reviewed again to be approved and published. If reservations have already begun, visitors will be affected.",
        "Continue to edit",
        "Cancel",
      );

      // If the user cancels in the confirmation modal, don't open the edit form
      if (!proceed) {
        return;
      }
    }

    setFormData({
      seasonId: formDataObj.currentSeason.id,
      level: formDataObj.level,
    });
    setShowFormPanel(true);
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
    const results = parks.flatMap((park) => {
      // If the Park doesn't match the Park-level "hard" filters, exclude it entirely.
      if (parkFiltersActive && !checkParkHard(park, filters)) {
        return [];
      }

      // If the Park doesn't match the Park-level "soft" filters, store that result.
      // We'll continue to check its areas and features to see if any of them match.
      const parkMatch = parkFiltersActive && checkParkSoft(park, filters);

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
        // Add a property to the Park object to indicate whether it matches the filters,
        // and add annotations for grouping in the template
        {
          ...park,
          matchesFilters: parkMatch,
          entityType: "park",
          parkName: park.name,
        },

        // Include Areas and Features within the park that match the filters
        ...matchingAreas,
        ...matchingFeatures,
      ];
    });

    return results;
  }, [parks, filters, parkFiltersActive]);

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

    return (
      <div className="paginated-table">
        <div className="mb-3">
          <RefreshTableContext.Provider value={{ refreshTable }}>
            <EditAndReviewTable
              data={pageData}
              filters={filters}
              onResetFilters={resetFilters}
              formPanelHandler={formPanelHandler}
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
    return (
      <MultiSelect
        options={statusOptions}
        onInput={(value) => {
          setPage(1);
          updateFilter("status", value);
        }}
        value={filters.status}
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

        <ConfirmationDialog {...modal.props} />

        <FormPanel
          show={showFormPanel}
          setShow={setShowFormPanel}
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

export default EditAndReview;
