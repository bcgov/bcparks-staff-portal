import groupBy from "lodash/groupBy";
import PropTypes from "prop-types";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList.jsx";

import "./ParkDetailsSeasonDates.scss";

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
  const currentSeasonDates = feature?.dateable?.currentSeasonDates;

  if (!currentSeasonDates) return null;

  // Group current season dates by date type
  const groupedDates = groupBy(
    currentSeasonDates,
    (dateType) => dateType.dateType.name,
  );

  return (
    <div className="feature">
      {feature.name !== "All sites" && <h4>{feature.name}</h4>}

      <table className="table table-striped dates mb-0">
        <tbody>
          {Object.entries(groupedDates).map(([dateTypeName, dateRanges]) => (
            <DateTypeRow
              key={dateTypeName}
              dateTypeName={dateTypeName}
              dateRanges={dateRanges}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Campgrounds contain one or more dateable features
function CampGround({ campground }) {
  return (
    <div className="campground mb-4">
      <h4>{campground.name}</h4>

      {campground.features.map((feature) => (
        <CampGroundFeature key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

export default function SeasonDates({ data }) {
  return (
    <div className="park-details-season-dates details-content">
      {data.campgrounds.length > 0 && (
        <div className="campgrounds">
          {data.campgrounds.map((campground) => (
            <CampGround key={campground.id} campground={campground} />
          ))}
        </div>
      )}

      {data.features.length > 0 && (
        <div className="features">
          {data.features.map((feature) => (
            <CampGroundFeature key={feature.id} feature={feature} />
          ))}
        </div>
      )}

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
  dateable: PropTypes.shape({
    currentSeasonDates: PropTypes.arrayOf(dateRangePropShape),
  }),
});

const campgroundPropShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(campgroundFeaturePropShape),
});

SeasonDates.propTypes = {
  data: PropTypes.shape({
    campgrounds: PropTypes.arrayOf(campgroundPropShape),
    features: PropTypes.arrayOf(campgroundFeaturePropShape),
    changeLogs: PropTypes.array.isRequired,
  }).isRequired,
};

CampGround.propTypes = {
  campground: campgroundPropShape,
};

CampGroundFeature.propTypes = {
  feature: campgroundFeaturePropShape,
};

DateTypeRow.propTypes = {
  dateTypeName: PropTypes.string.isRequired,
  dateRanges: PropTypes.arrayOf(dateRangePropShape),
};
