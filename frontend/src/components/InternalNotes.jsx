import PropTypes from "prop-types";
import classNames from "classnames";

import ErrorSlot from "@/components/ValidationErrorSlot";

import { formatDateShort } from "@/lib/utils";
import { useValidationContext } from "@/hooks/useValidation/useValidation";

import "./InternalNotes.scss";

function InternalNotes({
  errors = {},
  notes = "",
  setNotes,
  previousNotes = [],
  optional = true,
}) {
  const { elements } = useValidationContext();

  return (
    <div className="internal-notes mb-4">
      <h3>Internal notes</h3>

      {optional && <div className="my-2 text-secondary-grey">(Optional)</div>}

      {previousNotes.map((previousNote) => (
        <div className="previous-note" key={previousNote.id}>
          <p>
            <span className="note-content">{previousNote.notes}</span>

            <br />

            <span className="note-metadata">
              {formatDateShort(previousNote.createdAt)} by{" "}
              {previousNote.user.name}
            </span>
          </p>
        </div>
      ))}

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

      <ErrorSlot element={elements.INTERNAL_NOTES} />

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
  previousNotes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      notes: PropTypes.string.isRequired,
      createdAt: PropTypes.instanceOf(Date),
      user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    }),
  ),
  optional: PropTypes.bool,
};
