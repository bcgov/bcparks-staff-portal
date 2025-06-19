import PropTypes from "prop-types";
import classNames from "classnames";

function InternalNotes({ errors = {}, notes = "", setNotes }) {
  return (
    <div className="mb-4">
      <h3>Internal notes</h3>
      <p>
        If you are updating the current year&apos;s dates, provide an
        explanation for why dates have changed. Provide any other notes about
        these dates if needed.
      </p>
      <div
        className={classNames("form-group", "mb-2", {
          "has-error": errors.notes,
        })}
      >
        <textarea
          id="internal-notes"
          rows="5"
          name="notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
          }}
          className={classNames({
            "form-control": true,
            "is-invalid": errors.notes,
          })}
        ></textarea>
      </div>
      <div>
        <small>Visible to all BC Parks staff and Park Operators</small>
      </div>
    </div>
  );
}

export default InternalNotes;

InternalNotes.propTypes = {
  errors: PropTypes.object,
  notes: PropTypes.string,
  setNotes: PropTypes.func,
};
