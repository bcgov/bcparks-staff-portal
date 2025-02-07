import PropTypes from "prop-types";
import { formatDate } from "@/lib/utils";

import "./ChangeLogsList.scss";

// Displays season date changelogs (aka "notes")
export default function ChangeLogsList({ changeLogs = [] }) {
  return (
    <div className="change-logs-list">
      {changeLogs.map((changeLog) => (
        <p key={changeLog.id}>
          {changeLog.notes && (
            <span>
              {changeLog.notes}
              <br />
            </span>
          )}
          <span className="note-metadata">
            {formatDate(changeLog.createdAt, "America/Vancouver")} by{" "}
            {changeLog.userName}
          </span>
        </p>
      ))}
    </div>
  );
}

// Prop validation
ChangeLogsList.propTypes = {
  changeLogs: PropTypes.array,
};
