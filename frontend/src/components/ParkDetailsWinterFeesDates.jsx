import groupBy from "lodash/groupBy";
import PropTypes from "prop-types";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList.jsx";
import FeatureIcon from "@/components/FeatureIcon";

import "./ParkDetailsWinterFeesDates.scss";

function DateTypeRow({ dateTypeName, dateRanges }) {
  return (
    <tr>
      <td>{dateTypeName} dates</td>
      <td>
        {dateRanges.map((date) => (
          <DateRange key={date.id} start={date.startDate} end={date.endDate} />
        ))}
      </td>
    </tr>
  );
}

// "Dateable" features: Campsite groupings, etc.
function CampGroundFeature({ feature }) {
  const currentSeasonDates = feature?.dateRanges?.currentSeasonDates;

  if (!currentSeasonDates) return null;

  // Group current season dates by date type
  const groupedDates = groupBy(
    currentSeasonDates,
    (dateType) => dateType.dateType.name,
  );

  // Show only winter fees dates
  const winterFeesDates = groupedDates?.["Winter fees"];

  if (!winterFeesDates) return null;

  return (
    <div className="feature">
      <h5>{feature.name}</h5>

      <table className="table table-striped sub-area-dates mb-0">
        <tbody>
          <DateTypeRow
            dateTypeName="Winter fees"
            dateRanges={winterFeesDates}
          />
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
            {Object.entries(featureType.campgrounds).map(
              ([campgroundName, features]) => (
                <div key={campgroundName} className="campground mb-4">
                  {campgroundName !== "All sites" && <h4>{campgroundName}</h4>}

                  {features.map((feature) => (
                    <CampGroundFeature key={feature.id} feature={feature} />
                  ))}
                </div>
              ),
            )}
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
const dateRangePropShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  dateType: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
});

const campgroundFeaturePropShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  dateRanges: PropTypes.shape({
    currentSeasonDates: PropTypes.arrayOf(dateRangePropShape),
  }),
});

SeasonDates.propTypes = {
  data: PropTypes.shape({
    featureTypes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        campgrounds: PropTypes.objectOf(
          PropTypes.arrayOf(campgroundFeaturePropShape),
        ).isRequired,
      }),
    ).isRequired,
    changeLogs: PropTypes.array.isRequired,
  }),
};

CampGroundFeature.propTypes = {
  feature: campgroundFeaturePropShape,
};

DateTypeRow.propTypes = {
  dateTypeName: PropTypes.string.isRequired,
  dateRanges: PropTypes.arrayOf(dateRangePropShape),
};
