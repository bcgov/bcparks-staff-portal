import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames"; // Optional utility library for handling class names
import { faSort, faSortUp, faSortDown } from "@fa-kit/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function TableRow(park) {
  const navigate = useNavigate();

  function getParkLink() {
    return `/park/${park.orcs}`;
  }

  // navigate to park details page
  function navigateToPark() {
    navigate(getParkLink());
  }

  return (
    <tr onClick={navigateToPark} role="button">
      <th scope="row">
        <Link to={getParkLink()}>{park.name}</Link>
      </th>
      <td>
        {/* TODO: status pill component */}
        <span className={`badge rounded-pill text-bg-warning`}>
          {park.status}
        </span>
      </td>
      <td>{park.bundle}</td>
    </tr>
  );
}

export default function EditAndReviewTable({
  data,
  onSort,
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
            <th scope="col">Status</th>
            <th scope="col">Bundle</th>
          </tr>
        </thead>

        <tbody>
          {data.map((park) => (
            <TableRow key={park.id} {...park} />
          ))}
        </tbody>
      </table>
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
      bundle: PropTypes.string,
    }),
  ),
  onSort: PropTypes.func,
  sortOrder: PropTypes.string,
  sortColumn: PropTypes.string,
};
