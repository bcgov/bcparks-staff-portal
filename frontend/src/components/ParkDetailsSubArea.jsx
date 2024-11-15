import ParkSeason from "@/components/ParkDetailsSeason";
// @TODO: map icons to feature types
import walkInCamping from "@/assets/icons/walk-in-camping.svg";
import PropTypes from "prop-types";

export default function SubArea({ title, data }) {
  return (
    <section className="sub-area">
      <h2>
        <img src={walkInCamping} className="sub-area-icon" /> {title}
      </h2>

      {data.map((season) => (
        <ParkSeason key={season.id} season={season} />
      ))}
    </section>
  );
}

SubArea.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      operatingYear: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
