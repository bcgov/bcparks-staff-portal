import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faFilter } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState } from "react";
import { orderBy } from "lodash-es";
import PaginationBar from "@/components/PaginationBar";
import FilterPanel from "@/components/FilterPanel";

function EditAndReview() {
  const { data, loading, error } = useApiGet("/parks");
  const {
    data: sectionsData,
    loading: sectionsLoading,
    error: sectionsError,
  } = useApiGet("/sections");
  const {
    data: managementAreasData,
    loading: managementAreasLoading,
    error: managementAreasError,
  } = useApiGet("/management-areas");
  const parks = useMemo(() => data || [], [data]);
  const sections = useMemo(() => sectionsData || [], [sectionsData]);
  const managementAreas = useMemo(() => managementAreasData || [], [managementAreasData]);

  const statusOptions = [
    { value: "pending review", label: "Pending review" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "on API", label: "On API" },
  ];

  // table pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // table filter state
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // table sorting state
  const [sortColumn, setSortColumn] = useState("parkName");
  const [sortOrder, setSortOrder] = useState("asc");

  function resetFilters() {
    setPage(1);
    setNameFilter("");
    setStatusFilter([]);
  }

  function updateSort(column, order) {
    setPage(1);
    setSortColumn(column);
    setSortOrder(order);
  }

  const filteredParks = useMemo(
    () =>
      parks.filter((park) => {
        // If a name filter is set, filter out parks that don't match
        if (
          nameFilter.length > 0 &&
          !park.name
            .toLocaleLowerCase()
            .includes(nameFilter.toLocaleLowerCase())
        ) {
          return false;
        }

        // If status filters are set, filter out unselected statuses
        if (statusFilter.length > 0 && !statusFilter.includes(park.status)) {
          return false;
        }

        return true;
      }),
    [parks, nameFilter, statusFilter],
  );

  // returns sorted and filtered parks array
  function getSortedParks() {
    if (sortColumn === "parkName") {
      return orderBy(
        filteredParks,
        [(item) => item.name.toLowerCase()],
        [sortOrder === "asc" ? "asc" : "desc"],
      );
    }

    return filteredParks;
  }
  const sortedParks = getSortedParks();

  // Slice the sorted/filtered list of parks for pagination
  const totalPages = Math.ceil(sortedParks.length / pageSize);
  const pageData = useMemo(() => {
    const start = pageSize * (page - 1);
    const end = start + pageSize;

    return sortedParks.slice(start, end);
  }, [sortedParks, page, pageSize]);

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
            onSort={updateSort}
            onResetFilters={resetFilters}
            sortOrder={sortOrder}
            sortColumn={sortColumn}
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
  function StatusFilter({ options, filter, setFilter }) {
    return (
      <MultiSelect
        options={options}
        onInput={(value) => {
          setPage(1);
          setFilter(value);
        }}
        value={filter}
      >
        Filter by status {filter.length > 0 && `(${filter.length})`}
      </MultiSelect>
    );
  }

  // "clear filters" button
  function ClearFilter({ onClick }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="btn text-link text-decoration-underline align-self-end"
      >
        Clear filters
      </button>
    );
  }

  StatusFilter.propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    filter: PropTypes.arrayOf(PropTypes.string).isRequired,
    setFilter: PropTypes.func.isRequired,
  };

  ClearFilter.propTypes = {
    onClick: PropTypes.func.isRequired,
  };

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
                value={nameFilter}
                onChange={(e) => {
                  setPage(1);
                  setNameFilter(e.target.value);
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
              <StatusFilter
                options={statusOptions}
                filter={statusFilter}
                setFilter={setStatusFilter}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="btn btn-outline-primary align-self-end me-2"
            >
              <FontAwesomeIcon icon={faFilter} className="me-1" />
              All filters
            </button>
            <ClearFilter onClick={resetFilters} />
          </div>
        </div>

        {renderTable()}

        <FilterPanel
          show={showFilterPanel}
          setShow={setShowFilterPanel}
          sections={sections}
          sectionsLoading={sectionsLoading}
          sectionsError={sectionsError}
          managementAreas={managementAreas}
          managementAreasLoading={managementAreasLoading}
          managementAreasError={managementAreasError}
          statusFilter={
            <StatusFilter
              options={statusOptions}
              filter={statusFilter}
              setFilter={setStatusFilter}
            />
          }
          clearFilter={<ClearFilter onClick={resetFilters} />}
        />
      </div>
    </div>
  );
}

export default EditAndReview;
