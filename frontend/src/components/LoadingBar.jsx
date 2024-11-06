import PropTypes from "prop-types";

export default function LoadingBar({ percentage = 100 }) {
  return (
    <>
      <p>Loading...</p>

      <div
        className="progress"
        role="progressbar"
        aria-label="Loading data in progress"
      >
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </>
  );
}

LoadingBar.propTypes = {
  percentage: PropTypes.number,
};
