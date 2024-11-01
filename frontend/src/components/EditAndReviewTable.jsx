import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";

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

export default function EditAndReviewTable({ data }) {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th scope="col">Park name</th>
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
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      bundle: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
