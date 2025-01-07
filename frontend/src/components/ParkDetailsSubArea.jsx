import PropTypes from "prop-types";
import ParkSeason from "@/components/ParkDetailsSeason";
import FeatureIcon from "@/components/FeatureIcon";

export default function SubArea({ title, seasons }) {
  // Get the icon from the first season in the list (most recent)
  const icon = seasons[0].featureType.icon;

  return (
    <section className="sub-area">
      <h2>
        <FeatureIcon iconName={icon} />
        {title}
      </h2>

      {seasons.map((season) => (
        <ParkSeason key={season.id} season={season} />
      ))}
    </section>
  );
}

SubArea.propTypes = {
  title: PropTypes.string.isRequired,
  seasons: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      operatingYear: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      featureType: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        icon: PropTypes.string.isRequired,
      }).isRequired,
    }),
  ).isRequired,
};
