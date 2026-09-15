import PropTypes from "prop-types";
import { format } from "date-fns";

import { formatDateShortWithYear } from "@/lib/utils";
import "./LastUpdatedInfo.scss";

export default function LastUpdatedInfo({ lastUpdated }) {
  if (!lastUpdated) return null;

  return (
    <div className="fw-normal last-updated">
      Last updated {formatDateShortWithYear(lastUpdated.createdAt)} at{" "}
      {format(lastUpdated.createdAt, "h:mm aaa")} by {lastUpdated.createdBy}
    </div>
  );
}

LastUpdatedInfo.propTypes = {
  lastUpdated: PropTypes.shape({
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]).isRequired,
    createdBy: PropTypes.string.isRequired,
  }),
};
