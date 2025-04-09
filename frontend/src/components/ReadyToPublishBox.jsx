import PropTypes from "prop-types";
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ReadyToPublishBox({
  readyToPublish,
  setReadyToPublish,
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-4">Ready to publish?</h3>

      <p>
        Are these dates ready to be made available to the public the next time
        dates are published? When turned off, they will be flagged{" "}
        <span className="text-nowrap">
          (<FontAwesomeIcon className="text-danger mx-1" icon={faFlag} />)
        </span>{" "}
        and held in the ‘Approved’ state until it is marked ‘Ready to publish’.
        Approved dates are included in exported files.
      </p>

      <div className="form-check form-switch">
        <input
          checked={readyToPublish}
          onChange={() => setReadyToPublish(!readyToPublish)}
          className="form-check-input label-switch"
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
