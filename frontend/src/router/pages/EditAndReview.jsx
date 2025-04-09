import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState } from "react";
import { orderBy } from "lodash-es";
import PaginationBar from "@/components/PaginationBar";

function EditAndReview() {
  const { data, loading, error } = useApiGet("/parks");
  const parks = useMemo(() => data || [], [data]);

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

              <MultiSelect
                options={statusOptions}
                onInput={(value) => {
                  setPage(1);
                  setStatusFilter(value);
                }}
                value={statusFilter}
              >
                Filter by status{" "}
                {statusFilter.length > 0 && `(${statusFilter.length})`}
              </MultiSelect>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="btn text-link text-decoration-underline align-self-end"
            >
              Clear filters
            </button>
          </div>
        </div>

        {renderTable()}
      </div>
    </div>
  );
}

export default EditAndReview;
