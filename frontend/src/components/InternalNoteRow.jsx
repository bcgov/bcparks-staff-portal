import PropTypes from "prop-types";
import classNames from "classnames";

// Formats createdAt date
// e.g. "2024-06-20T18:25:43.511Z" -> "Thu, Jun 20"
function formatCreatedAt(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) return "Unknown date";

  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function InternalNoteRow({ notes }) {
  if (!notes || notes.length === 0) return null;

  return (
    <tr className={classNames("table-row--note")}>
      <td className="fw-bold">Internal notes</td>
      <td></td>
      <td>
        <ul className="list-unstyled mb-0">
          {notes.map((note) => (
            <li key={note.id}>
              <div>{note.note}</div>
              <p className="text-muted">
                {formatCreatedAt(note.createdAt)} by {note.createdBy}
              </p>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

InternalNoteRow.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      note: PropTypes.string.isRequired,
      createdAt: PropTypes.string,
      createdBy: PropTypes.string,
    }),
  ),
};
