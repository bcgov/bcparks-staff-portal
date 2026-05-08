import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryHistory.css";
import moment from "moment";
import { useAuth } from "react-oidc-context";
import useCms from "@/hooks/useCms";
import { dateCompare } from "@/lib/advisories/utils/AppUtil";

export default function AdvisoryHistory({ data: { advisoryNumber } }) {
  const [advisoryHistory, setAdvisoryHistory] = useState([]);
  const auth = useAuth();
  const { cmsGet } = useCms();

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading && advisoryNumber) {
      cmsGet(`public-advisory-audits/history/${advisoryNumber}`, {}, "").then(
        (advisories) => {
          const advisoriesHistory = [];

          if (advisories && advisories.length > 0) {
            advisories.forEach((ad) => {
              // Add review events to the history if they exist, or continue to look for other events
              if (ad.reviewedByName && ad.reviewedAt) {
                advisoriesHistory.push({
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.reviewedByName,
                  submittedTime: moment(ad.reviewedAt).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Reviewed by",
                  dateToCompare: moment(ad.reviewedAt).valueOf(),
                });
              } else if (ad.modifiedBy && ad.modifiedBy === "system") {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: moment(ad.modifiedDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Published by",
                  dateToCompare: moment(ad.modifiedDate).valueOf(),
                };

                if (ad.removalDate) {
                  record.displayText = "Removed by";
                }
                advisoriesHistory.push(record);
              } else if (!ad.modifiedDate && ad.createdDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.submittedBy,
                  submittedTime: moment(ad.createdDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Requested by",
                  dateToCompare: moment(ad.createdDate).valueOf(),
                };

                advisoriesHistory.push(record);
              } else if (ad.modifiedDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: moment(ad.modifiedDate).format(
                    "MMMM DD, yyyy hh:mm A",
                  ),
                  displayText: "Updated by",
                  dateToCompare: moment(ad.modifiedDate).valueOf(),
                };

                advisoriesHistory.push(record);
              }
            });

            // Keep the newest history item first regardless of whether it came from
            // a review, publish, request, or update event
            advisoriesHistory.sort(dateCompare);
            setAdvisoryHistory([...advisoriesHistory]);
          }
        },
      );
    }
  }, [
    advisoryNumber,
    auth.isAuthenticated,
    auth.isLoading,
    setAdvisoryHistory,
    cmsGet,
  ]);
  return (
    <div className="ad-history-container px-3">
      {advisoryHistory.length > 0 &&
        advisoryHistory.map((ah, index) => (
          <div key={index} className="row">
            Revision number {ah.revisionNumber} {ah.displayText.toLowerCase()}{" "}
            {ah.submitter} at {ah.submittedTime}
          </div>
        ))}
    </div>
  );
}

AdvisoryHistory.propTypes = {
  data: PropTypes.shape({
    advisoryNumber: PropTypes.number,
  }).isRequired,
};
