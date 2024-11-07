import { useState } from "react";
import classNames from "classnames";
import { faChevronDown, faPen, faChevronUp } from "@fa-kit/icons/classic/solid";
import { faCircleExclamation } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import useDate from "@/hooks/useDate";

export default function ParkSeason({ season }) {
  const { parkId } = useParams();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);

  // Returns a chevron icon based on the expansion state
  function getExpandIcon() {
    return expanded ? faChevronUp : faChevronDown;
  }

  // @TODO: get real details data from the API
  function expandableContent() {
    if (!expanded) return <div></div>;

    return (
      <div className="details-content">
        {/* TODO: render real data when available */}
        <h4>TODO: Alouette Campground</h4>

        <table className="table table-striped sub-area-dates">
          <tbody>
            <tr>
              <th scope="row">Operating dates</th>
              <td>Mon, Mar 28 - Wed, Oct 15</td>
            </tr>
            <tr>
              <th scope="row">Reservation dates</th>
              <td>
                Tue, Mar 28 - Wed, Apr 1<br />
                Mon, May 1 - Wed, Oct 14
              </td>
            </tr>
          </tbody>
        </table>

        <h4>Gold Creek Campground</h4>

        <table className="table table-striped sub-area-dates">
          <tbody>
            <tr>
              <th scope="row">Operating dates</th>
              <td>Mon, Mar 28 - Wed, Oct 15</td>
            </tr>
            <tr>
              <th scope="row">Reservation dates</th>
              <td>
                Tue, Mar 28 - Wed, Apr 1<br />
                Mon, May 1 - Wed, Oct 14
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  function toggleExpand() {
    setExpanded(!expanded);
  }

  const seasonClasses = classNames({
    season: true,
    expanded,
  });

  const detailsClasses = classNames({
    details: true,
    expanded,
  });

  // @TODO: implement logic to show/hide preview button
  const showPreviewButton = true;

  const updateDate = useDate(season.updatedAt);

  function navigateToEdit() {
    navigate(`/park/${parkId}/edit/${season.id}`);
  }

  function navigateToPreview() {
    navigate(`/park/${parkId}/edit/${season.id}/review`);
  }

  return (
    <div className={seasonClasses}>
      <div className={detailsClasses}>
        <header role="button" onClick={toggleExpand}>
          <h3>{season.operatingYear} season</h3>

          <StatusBadge status={season.status} />

          <button
            onClick={toggleExpand}
            className="btn btn-text-primary expand-toggle"
          >
            <span>Last updated: {updateDate.formatted()}</span>
            <FontAwesomeIcon
              className="append-content ms-2"
              icon={getExpandIcon()}
            />
          </button>
        </header>

        {expandableContent()}
      </div>

      <div className="controls">
        <button onClick={navigateToEdit} className="btn btn-text-primary">
          <FontAwesomeIcon className="append-content me-2" icon={faPen} />
          <span>Edit</span>
        </button>

        {showPreviewButton && (
          <>
            <div className="divider"></div>

            <button
              onClick={navigateToPreview}
              className="btn btn-text-primary"
            >
              <FontAwesomeIcon
                className="append-content me-2"
                icon={faCircleExclamation}
              />
              <span>Preview</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// prop validation
ParkSeason.propTypes = {
  season: PropTypes.shape({
    id: PropTypes.number.isRequired,
    operatingYear: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
  }),
};
