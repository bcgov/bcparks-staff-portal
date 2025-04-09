import PropTypes from "prop-types";
import FeatureIcon from "@/components/FeatureIcon";
import ParkSeason from "@/components/ParkDetailsSeason";

export default function FeatureType({ title, icon, seasons, seasonProps }) {
  if (seasons.length === 0) {
    return null;
  }

  return (
    <section className="feature-type seasons">
      <h2>
        <FeatureIcon iconName={icon} />
        {title}
      </h2>

      {seasons.map((season) => (
        <ParkSeason key={season.id} season={season} {...seasonProps} />
      ))}
    </section>
  );
}

FeatureType.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  seasons: PropTypes.arrayOf(PropTypes.object).isRequired,

  // Props to pass to the ParkSeason child component
  seasonProps: PropTypes.shape({
    getDataEndpoint: PropTypes.func.isRequired,
    getEditRoutePath: PropTypes.func.isRequired,
    getReviewRoutePath: PropTypes.func.isRequired,
    getTitle: PropTypes.func.isRequired,
    DetailsComponent: PropTypes.elementType.isRequired,
  }),
};
