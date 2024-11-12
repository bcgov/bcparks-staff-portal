import PropTypes from "prop-types";
import { useEffect, useMemo } from "react";
import useDate from "@/hooks/useDate";
import DateRange from "@/components/DateRange";

function DateTypeRow({ dateType }) {
  console.log("dateType", dateType);

  return (
    <tr>
      <td>{dateType.dateType.name} dates</td>
      <td>
        <DateRange start={dateType.startDate} end={dateType.endDate} />
      </td>
    </tr>
  );
}

// "Dateable" features: Campsite groupings, etc.
function CampGroundFeature({ feature }) {
  return (
    <div className="feature">
      <h5>{feature.name}</h5>

      <table className="table table-striped sub-area-dates mb-0">
        <tbody>
          {feature?.dateable?.currentSeasonDates?.map((dateType) => (
            <DateTypeRow key={dateType.id} dateType={dateType} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Campground contain one or more dateable features
function CampGround({ campground }) {
  return (
    <div className="campground">
      <h4>{campground.name}</h4>

      {campground.features.map((feature) => (
        <CampGroundFeature key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

export default function SeasonDates({ data }) {
  return (
    <div className="details-content">
      {data.campgrounds.map((campground) => (
        <CampGround key={campground.id} campground={campground} />
      ))}
    </div>
  );
}
