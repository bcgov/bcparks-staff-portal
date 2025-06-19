import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faFilter } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState } from "react";
import PaginationBar from "@/components/PaginationBar";
import FilterPanel from "@/components/FilterPanel";
import FormPanel from "@/components/FormPanel";

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
    { value: "requested", label: "Requested by HQ" },
    { value: "pending review", label: "Pending HQ review" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
  ];

  // table pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // table filter state
  const [filters, setFilters] = useState({
    name: "",
    bundles: [],
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

  // open form panel when the Edit button is clicked
  function formPanelHandler(formDataObj) {
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
      bundles: [],
      status: [],
      sections: [],
      managementAreas: [],
      dateTypes: [],
      featureTypes: [],
      isInReservationSystem: false,
      hasDateNote: false,
    });
  }

  const filteredParks = useMemo(
    () =>
      parks.filter((park) => {
        // If a name filter is set, filter out parks that don't match
        if (
          filters.name.length > 0 &&
          !park.name
            .toLocaleLowerCase()
            .includes(filters.name.toLocaleLowerCase())
        ) {
          return false;
        }

        // filter by status
        if (
          filters.status.length > 0 &&
          !filters.status.includes(park.status)
        ) {
          return false;
        }

        // TODO: CMS-324
        // filter by bundles

        // filter by sections
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

        // filter by management areas
        if (
          filters.managementAreas.length > 0 &&
          !filters.managementAreas.some((area) =>
            park.managementArea.some(
              (parkArea) => parkArea.number === area.managementAreaNumber,
            ),
          )
        ) {
          return false;
        }

        // filter by date types
        if (
          filters.dateTypes.length > 0 &&
          !filters.dateTypes.some((filterDateType) =>
            park.seasons.some((season) =>
              season.dateRanges.some(
                (dateRange) => dateRange.dateType.id === filterDateType.id,
              ),
            ),
          )
        ) {
          return false;
        }

        // filter by feature types
        if (
          filters.featureTypes.length > 0 &&
          !filters.featureTypes.some((filterFeatureType) =>
            park.features.some(
              (feature) => feature.featureType.id === filterFeatureType.id,
            ),
          )
        ) {
          return false;
        }

        // filter by isInReservationSystem
        if (
          filters.isInReservationSystem &&
          !(
            park.inReservationSystem ||
            park.features.some((feature) => feature.inReservationSystem)
          )
        ) {
          return false;
        }

        // TODO: CMS-788
        // filter by hasDateNote

        return true;
      }),
    [parks, filters],
  );

  function updateFilter(key, value) {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }

  // Slice the list of parks for pagination
  const totalPages = useMemo(
    () => Math.ceil(filteredParks.length / pageSize),
    [filteredParks, pageSize],
  );
  const pageData = useMemo(() => {
    const start = pageSize * (page - 1);
    const end = start + pageSize;

    return filteredParks.slice(start, end);
  }, [filteredParks, page, pageSize]);

  // components
  function renderTable() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    return (
      <div className="paginated-table">
        <div className="mb-3">
          <EditAndReviewTable
            data={pageData}
            onResetFilters={resetFilters}
            formPanelHandler={formPanelHandler}
          />
        </div>

        <div className="d-flex justify-content-center">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
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
  function ClearFilter() {
    return (
      <button
        type="button"
        onClick={resetFilters}
        className="btn text-link text-decoration-underline align-self-end"
      >
        Clear filters
      </button>
    );
  }

  // Fetch all the data from the API when something changes
  function refreshData() {
    fetchData();
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
            <ClearFilter />
          </div>
        </div>

        {renderTable()}

        <FormPanel
          show={showFormPanel}
          setShow={setShowFormPanel}
          formData={formData}
          onDataUpdate={refreshData}
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
          clearFilter={<ClearFilter />}
        />
      </div>
    </div>
  );
}

export default EditAndReview;
