import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useState } from "react";
import orderBy from "lodash/orderBy";

function EditAndReview() {
  const { data, loading, error } = useApiGet("/parks");
  const parks = data || [];

  const statusOptions = [
    { value: "under review", label: "Under review" },
    { value: "requested", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
  ];
  const statusValues = statusOptions.map((option) => option.value);

  // table filter state
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([...statusValues]);

  // table sorting state
  const [sortColumn, setSortColumn] = useState("parkName");
  const [sortOrder, setSortOrder] = useState("asc");

  function resetFilters() {
    setNameFilter("");
    setStatusFilter([...statusValues]);
  }

  function updateSort(column, order) {
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

  function renderTable() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    return (
      <EditAndReviewTable
        data={sortedParks}
        onSort={updateSort}
        onResetFilters={resetFilters}
        sortOrder={sortOrder}
        sortColumn={sortColumn}
      />
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
              onChange={(e) => setNameFilter(e.target.value)}
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
            onInput={setStatusFilter}
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
