import PropTypes from "prop-types";
import { formatTimestamp } from "@/lib/utils";

// Displays season date changelogs (aka "notes")
export default function ChangeLogsList({ changeLogs = [] }) {
  return (
    <>
      {changeLogs.map((changeLog) => (
        <p key={changeLog.id}>
          {changeLog.notes && (
            <span>
              {changeLog.notes}
              <br />
            </span>
          )}
          <span className="note-metadata">
            {changeLog.notes ? "" : "Submitted "}
            {formatTimestamp(changeLog.createdAt)} by {changeLog.user.name}
          </span>
        </p>
      ))}
    </>
  );
}

// Prop validation
ChangeLogsList.propTypes = {
  changeLogs: PropTypes.array,
};
