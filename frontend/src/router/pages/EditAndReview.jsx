import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import PaginationBar from "./PaginationBar";

function EditAndReview() {
  const { data, loading, error } = useApiGet("/parks");
  const parks = data || [];

  const statusOptions = [
    { value: "pending review", label: "Pending review" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
  ];
  const statusValues = statusOptions.map((option) => option.value);

  // table pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // table filter state
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([...statusValues]);

  // table sorting state
  const [sortColumn, setSortColumn] = useState("parkName");
  const [sortOrder, setSortOrder] = useState("asc");

  function resetFilters() {
    setPage(1);
    setNameFilter("");
    setStatusFilter([...statusValues]);
  }

  function updateSort(column, order) {
    setPage(1);
    setSortColumn(column);
    setSortOrder(order);
  }

  const filteredParks = parks.filter((park) => {
    if (
      nameFilter &&
      !park.name.toLocaleLowerCase().includes(nameFilter.toLocaleLowerCase())
    ) {
      return false;
    }

    if (!statusFilter.includes(park.status)) {
      return false;
    }

    return true;
  });

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

        <div className="d-flex justify-content-end">
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
    <div className="page dates-management">
      <div className="table-filters row mb-4">
        <div className="col-lg-3 col-md-6 col-12">
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

        <div className="col-lg-3 col-md-6 col-12">
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
            Filter by status
          </MultiSelect>
        </div>

        <div className="col-lg-3 col-md-6 col-12 d-flex">
          <button
            onClick={resetFilters}
            className="btn btn-link align-self-end"
          >
            Clear filters
          </button>
        </div>
      </div>

      {renderTable()}
    </div>
  );
}

export default EditAndReview;
