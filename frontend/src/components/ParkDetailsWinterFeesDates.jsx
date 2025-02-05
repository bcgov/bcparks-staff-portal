import PropTypes from "prop-types";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList.jsx";
import FeatureIcon from "@/components/FeatureIcon";

import "./ParkDetailsWinterFeesDates.scss";

function DateTypeRow({ dateRanges }) {
  return (
    <tr>
      <td>Winter fee dates</td>
      <td>
        {dateRanges.map((date) => (
          <DateRange
            key={date.id}
            start={date.startDate}
            end={date.endDate}
            formatWithYear={true}
          />
        ))}
      </td>
    </tr>
  );
}

// "Dateable" features: Campsite groupings, etc.
function CampGroundFeature({ feature }) {
  const { currentWinterDates } = feature;

  if (!currentWinterDates) return null;

  return (
    <div className="feature">
      {feature.name !== "All sites" && <h4>{feature.name}</h4>}

      <table className="table table-striped dates mb-0">
        <tbody>
          <DateTypeRow dateRanges={currentWinterDates} />
        </tbody>
      </table>
    </div>
  );
}

export default function SeasonDates({ data }) {
  return (
    <div className="park-details-winter-fees-dates details-content">
      <div className="winter-fee-seasons">
        {data.featureTypes.map((featureType) => (
          <div key={featureType.id} className="winter-fees-season mb-4">
            <h3 className="header-with-icon">
              <FeatureIcon iconName={featureType.icon} />
              {featureType.name}
            </h3>

            <div key={featureType.id} className="campground mb-4">
              {featureType.features.map((feature) => (
                <CampGroundFeature key={feature.id} feature={feature} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.changeLogs.length > 0 && (
        <div className="notes">
          <h4>Notes</h4>
          <ChangeLogsList changeLogs={data.changeLogs} />
        </div>
      )}
    </div>
  );
}

// prop validation
DateTypeRow.propTypes = {
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

SeasonDates.propTypes = {
  data: PropTypes.shape({
    featureTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
    changeLogs: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

CampGroundFeature.propTypes = {
  feature: PropTypes.object.isRequired,
};
