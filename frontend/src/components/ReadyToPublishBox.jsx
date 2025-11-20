import PropTypes from "prop-types";
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ReadyToPublishBox({
  readyToPublish,
  setReadyToPublish,
  seasonType = "regular",
}) {
  function ReadyToPublishSwitch() {
    const switchId =
      seasonType === "winter" ? "ready-to-publish-winter" : "ready-to-publish";

    return (
      <div className="form-check form-switch">
        <input
          checked={readyToPublish}
          onChange={() => setReadyToPublish(!readyToPublish)}
          className="form-check-input label-switch"
          type="checkbox"
          role="switch"
          id={switchId}
        />
        <label className="form-check-label" htmlFor={switchId}>
          Ready to publish
        </label>
      </div>
    );
  }

  return seasonType === "winter" ? (
    <div>
      <h5>Ready to publish winter fee?</h5>
      <ReadyToPublishSwitch />
    </div>
  ) : (
    <div className="mb-4">
      <h3 className="mb-4">Ready to publish?</h3>

      <p>
        Are these dates ready to be made available to the public the next time
        dates are published? When ‘No’ is selected, they will be flagged{" "}
        <span className="text-nowrap">
          (<FontAwesomeIcon className="text-danger mx-1" icon={faFlag} />)
        </span>{" "}
        and held in the ‘Approved’ state until ‘Yes’ is selected.
      </p>

      <ReadyToPublishSwitch />
    </div>
  );
}

// add prop types
ReadyToPublishBox.propTypes = {
  readyToPublish: PropTypes.bool.isRequired,
  setReadyToPublish: PropTypes.func.isRequired,
  seasonType: PropTypes.oneOf(["regular", "winter"]),
};
