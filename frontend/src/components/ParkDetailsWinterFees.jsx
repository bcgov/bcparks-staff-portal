import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import classNames from "classnames";
import PropTypes from "prop-types";
import { faChevronDown, faPen, faChevronUp } from "@fa-kit/icons/classic/solid";
import { faCircleExclamation } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDate } from "@/lib/utils";
import { useApiGet } from "@/hooks/useApi";
import ExpandableContent from "@/components/ExpandableContent";
import FeatureIcon from "@/components/FeatureIcon";
import NotReadyFlag from "@/components/NotReadyFlag";
import StatusBadge from "@/components/StatusBadge";
import WinterFeesDates from "@/components/ParkDetailsWinterFeesDates";

function WinterSeason({ season }) {
  const navigate = useNavigate();
  const { parkId } = useParams();

  const [expanded, setExpanded] = useState(false);

  const {
    data: datesData,
    loading,
    error,
    fetchData,
  } = useApiGet(`/winter-fees/${season.id}`, {
    instant: false,
  });

  // @TODO: implement logic to show/hide preview button
  const showPreviewButton = true;

  // @TODO: implement logic to disable preview button
  const disablePreviewButton = true;

  function toggleExpand(event) {
    // Prevent button click events from bubbling up to the clickable parent
    event.stopPropagation();

    // If the panel is about to expand, fetch the data
    if (!expanded && datesData === null) {
      fetchData();
    }

    setExpanded(!expanded);
  }

  function navigateToEdit() {
    navigate(`/park/${parkId}/winter-fees/${season.id}/edit`);
  }

  function navigateToPreview() {
    navigate(`/park/${parkId}/winter-fees/${season.id}/preview`);
  }

  const updateDate = formatDate(season.updatedAt, "America/Vancouver");

  const title = `${season.operatingYear} – ${season.operatingYear + 1}`;

  return (
    <div className={classNames("winter-fees season expandable", { expanded })}>
      <div className={classNames("details", { expanded })}>
        <header role="button" onClick={toggleExpand}>
          <h3>{title}</h3>

          <StatusBadge status={season.status} />
          <NotReadyFlag show={!season.readyToPublish} />

          <button
            onClick={toggleExpand}
            className="btn btn-text-primary expand-toggle"
          >
            <span>Last updated: {updateDate}</span>
            <FontAwesomeIcon
              className="append-content ms-2"
              icon={expanded ? faChevronUp : faChevronDown}
            />
          </button>
        </header>

        <ExpandableContent expanded={expanded} loading={loading} error={error}>
          <WinterFeesDates data={datesData} />
        </ExpandableContent>
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
              disabled={disablePreviewButton}
            >
              <FontAwesomeIcon
                className="append-content me-2"
                icon={faCircleExclamation}
              />
              <span>Review</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// prop validation
WinterSeason.propTypes = {
  season: PropTypes.shape({
    id: PropTypes.number.isRequired,
    operatingYear: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    readyToPublish: PropTypes.bool.isRequired,
  }).isRequired,
};

export default function WinterFees({ data }) {
  return (
    <section className="winter-fees">
      <h2>
        <FeatureIcon iconName="winter-recreation" />
        Winter fees
      </h2>

      {data.map((season) => (
        <WinterSeason key={season.id} season={season} />
      ))}
    </section>
  );
}

// prop validation
WinterFees.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      operatingYear: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
      readyToPublish: PropTypes.bool.isRequired,
    }),
  ).isRequired,
};
