import PropTypes from "prop-types";

export default function ReadyToPublishBox({
  readyToPublish,
  setReadyToPublish,
}) {
  return (
    <div className="mb-12">
      <h2 className="mb-4">Ready to publish?</h2>

      <p>
        Are these dates ready to be made available to the public the next time
        dates are published? When turned off, they will be flagged and held in
        the ‘Approved’ state until it is marked ‘Ready to publish’. Approved
        dates are included in exported files.
      </p>

      <div className="form-check form-switch mb-4">
        <input
          checked={readyToPublish}
          onChange={() => setReadyToPublish(!readyToPublish)}
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="ready-to-publish"
        />
        <label className="form-check-label" htmlFor="ready-to-publish">
          Ready to publish
        </label>
      </div>
    </div>
  );
}

// add prop types
ReadyToPublishBox.propTypes = {
  readyToPublish: PropTypes.bool.isRequired,
  setReadyToPublish: PropTypes.func.isRequired,
};
