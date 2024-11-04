import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import { useState } from "react";
import orderBy from "lodash/orderBy";

function EditAndReview() {
  const { data, loading } = useApiGet("/parks");

  // table filter state
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // table sorting state
  const [sortColumn, setSortColumn] = useState("parkName");
  const [sortOrder, setSortOrder] = useState("asc");

  function resetFilters() {
    setNameFilter("");
    setStatusFilter("");
  }

  function updateSort(column, order) {
    setSortColumn(column);
    setSortOrder(order);
  }

  // add status values to parks
  const parks =
    data?.map((park) => ({
      ...park,
      status: `TODO: Active ${park.id}`,
    })) || [];

  // unique values for filter dropdowns
  const statusValues =
    parks
      .map((park) => park.status)
      .filter((value, index, self) => self.indexOf(value) === index) || [];

  const filteredParks = parks.filter((park) => {
    if (
      nameFilter &&
      !park.name.toLocaleLowerCase().includes(nameFilter.toLocaleLowerCase())
    ) {
      return false;
    }

    if (statusFilter && park.status !== statusFilter) {
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

          <select
            id="status"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>

            {statusValues.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <EditAndReviewTable
          data={sortedParks}
          onSort={updateSort}
          sortOrder={sortOrder}
          sortColumn={sortColumn}
        />
      )}
    </div>
  );
}

export default EditAndReview;
