import { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Accordion from "react-bootstrap/Accordion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fa-kit/icons/classic/solid";
import { formatDateShortWithYear } from "@/lib/utils";
import { useApiGet } from "@/hooks/useApi";

// Formats createdAt date
// e.g. "2024-06-20T18:25:43.511Z" -> "Thu, Jun 20"
function formatCreatedAt(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) return "Unknown date";

  return formatDateShortWithYear(date);
}

export default function InternalNotesRow({ seasonId }) {
  const [hasRequestedNotes, setHasRequestedNotes] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: fetchedNotes,
    loading,
    error,
    fetchData,
  } = useApiGet(`/seasons/${seasonId}/notes`, { instant: false });

  const visibleNotes = Array.isArray(fetchedNotes) ? fetchedNotes : [];

  // Toggles the open state and fetches notes if opening for the first time
  async function toggleOpen() {
    if (!isOpen && !hasRequestedNotes) {
      // If the notes data isn't loaded yet, load it and then open the notes
      try {
        await fetchData();
        setHasRequestedNotes(true);
        setIsOpen(true);
      } catch (apiError) {
        // Keep this false so collapsing and reopening retries the request.
        setHasRequestedNotes(false);
        console.error("Failed to fetch internal notes for season", seasonId);
        console.error(apiError);
      }
    } else {
      // If the notes data is already loaded, just toggle the open state
      setIsOpen((prev) => !prev);
    }
  }

  return (
    <tr className={classNames("table-row--note")}>
      <td className="fw-bold">Internal notes</td>
      {/* Keep the middle td for table styling */}
      <td></td>
      <td>
        <Accordion activeKey={isOpen ? "internal-notes" : null}>
          <Accordion.Collapse
            id={`internal-notes-${seasonId}`}
            eventKey="internal-notes"
          >
            <>
              {visibleNotes.length > 0 && (
                <ul className="list-unstyled">
                  {visibleNotes.map((note) => (
                    <li key={note.id}>
                      <div>{note.note}</div>
                      <p className="text-muted">
                        {formatCreatedAt(note.createdAt)} by {note.createdBy}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {!error && hasRequestedNotes && visibleNotes.length === 0 && (
                <p className="mb-0 text-muted">
                  No internal notes found for this season.
                </p>
              )}
            </>
          </Accordion.Collapse>

          {!loading && error && (
            <p className="mb-0 text-danger">Unable to load internal notes.</p>
          )}

          <button
            type="button"
            className="btn btn-text text-link text-decoration-underline p-0"
            onClick={toggleOpen}
            aria-expanded={isOpen}
            aria-controls={`internal-notes-${seasonId}`}
            disabled={loading}
          >
            {loading ? (
              <>
                Loading internal notes...
                <span
                  className="spinner-border spinner-border-sm ms-2"
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                {isOpen ? "Hide internal notes" : "Show internal notes"}
                <FontAwesomeIcon
                  icon={isOpen ? faChevronUp : faChevronDown}
                  className="ms-2"
                />
              </>
            )}
          </button>
        </Accordion>
      </td>
    </tr>
  );
}

InternalNotesRow.propTypes = {
  seasonId: PropTypes.number.isRequired,
};
