import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import { useState } from "react";

function EditAndReview() {
  const { data, loading } = useApiGet("/parks");

  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bundleFilter, setBundleFilter] = useState("");

  function resetFilters() {
    setNameFilter("");
    setStatusFilter("");
    setBundleFilter("");
  }

  // add bundle and status values to parks
  const parks =
    data?.map((park) => ({
      ...park,
      bundle: `TODO: Bundle ${park.id}`,
      status: `TODO: Active ${park.id}`,
    })) || [];

  // unique values for status and bundle
  const statusValues =
    parks
      .map((park) => park.status)
      .filter((value, index, self) => self.indexOf(value) === index) || [];
  const bundleValues =
    parks
      .map((park) => park.bundle)
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

    if (bundleFilter && park.bundle !== bundleFilter) {
      return false;
    }

    return true;
  });

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

        <div className="col-lg-3 col-md-6 col-12">
          <label htmlFor="bundle" className="form-label">
            Bundle
          </label>

          <select
            id="bundle"
            className="form-select"
            value={bundleFilter}
            onChange={(e) => setBundleFilter(e.target.value)}
          >
            <option value="">All</option>

            {bundleValues.map((bundle) => (
              <option key={bundle} value={bundle}>
                {bundle}
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
        <EditAndReviewTable data={filteredParks} />
      )}
    </div>
  );
}

export default EditAndReview;
