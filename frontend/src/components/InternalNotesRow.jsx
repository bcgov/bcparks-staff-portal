import { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Accordion from "react-bootstrap/Accordion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fa-kit/icons/classic/solid";
import { formatDateShort } from "@/lib/utils";

// Formats createdAt date
// e.g. "2024-06-20T18:25:43.511Z" -> "Thu, Jun 20"
function formatCreatedAt(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) return "Unknown date";

  return formatDateShort(date);
}

export default function InternalNotesRow({ notes }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!notes || notes.length === 0) return null;

  return (
    <tr className={classNames("table-row--note")}>
      <td className="fw-bold">Internal notes</td>
      {/* Keep the middle td for table styling */}
      <td></td>
      <td>
        <Accordion activeKey={isOpen ? "internal-notes" : null}>
          <Accordion.Collapse
            id={`internal-notes-${notes[0].id}`}
            eventKey="internal-notes"
          >
            <ul className="list-unstyled">
              {notes.map((note) => (
                <li key={note.id}>
                  <div>{note.note}</div>
                  <p className="text-muted">
                    {formatCreatedAt(note.createdAt)} by {note.createdBy}
                  </p>
                </li>
              ))}
            </ul>
          </Accordion.Collapse>

          <button
            type="button"
            className="btn btn-text text-link text-decoration-underline p-0"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={`internal-notes-${notes[0].id}`}
          >
            {isOpen ? "Hide internal notes" : "Show internal notes"}
            <FontAwesomeIcon
              icon={isOpen ? faChevronUp : faChevronDown}
              className="ms-2"
            />
          </button>
        </Accordion>
      </td>
    </tr>
  );
}

InternalNotesRow.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      note: PropTypes.string.isRequired,
      createdAt: PropTypes.string,
      createdBy: PropTypes.string,
    }),
  ),
};
