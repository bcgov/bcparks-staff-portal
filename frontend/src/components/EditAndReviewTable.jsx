import { useMemo } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import {
  faSort,
  faSortUp,
  faSortDown,
  faChevronRight,
} from "@fa-kit/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import paths from "@/router/paths";
import StatusBadge from "@/components/StatusBadge";
import NotReadyFlag from "@/components/NotReadyFlag";

function TableRow(park) {
  const navigate = useNavigate();
  const parkLink = useMemo(() => paths.park(park.orcs), [park.orcs]);

  // navigate to park details page
  function navigateToPark() {
    navigate(parkLink);
  }

  return (
    <tr onClick={navigateToPark} role="button">
      <th scope="row">{park.name}</th>
      <td>
        <StatusBadge status={park.status} />
        <NotReadyFlag show={!park.readyToPublish} />
      </td>
      <td className="text-end">
        <Link to={parkLink} aria-label={`View ${park.name} park details`}>
          <FontAwesomeIcon
            className="me-2"
            icon={faChevronRight}
            aria-hidden="true"
          />
          <span className="visually-hidden">View park details</span>
        </Link>
      </td>
    </tr>
  );
}

export default function EditAndReviewTable({
  data,
  onSort,
  onResetFilters,
  sortOrder,
  sortColumn,
}) {
  function getSortClasses(columnId) {
    return classNames({
      sortable: true,
      sorting: sortColumn === columnId,
      "sort-asc": sortOrder === columnId,
    });
  }

  // updates the table sort column, or toggles the sort order
  function updateSort(columnId) {
    if (sortColumn === columnId) {
      onSort(columnId, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(columnId, "asc");
    }
  }

  // returns the column sort icon, based on table sorting state
  function getSortIcon(columnId) {
    if (sortColumn === columnId) {
      return sortOrder === "asc" ? faSortUp : faSortDown;
    }

    return faSort;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th
              scope="col"
              className={getSortClasses("parkName")}
              role="button"
              onClick={() => updateSort("parkName")}
            >
              Park name{" "}
              <FontAwesomeIcon
                className="ms-1"
                icon={getSortIcon("parkName")}
              />
            </th>
            <th scope="col" colSpan="2">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((park) => (
            <TableRow key={park.id} {...park} />
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center">
          <p>No records match your filters. </p>
          <p>
            <button onClick={onResetFilters} className="btn btn-primary">
              Reset filters to show all records
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

// Define prop types for EditAndReviewTable
EditAndReviewTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
  onSort: PropTypes.func,
  onResetFilters: PropTypes.func,
  sortOrder: PropTypes.string,
  sortColumn: PropTypes.string,
};
