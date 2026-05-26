import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./AdvisoryHistory.css";
import { format } from "date-fns";
import { useAuth } from "react-oidc-context";
import useCms from "@/hooks/useCms";
import { dateCompare } from "@/lib/advisories/utils/AppUtil";

export default function AdvisoryHistory({
  data: { advisoryNumber },
  revisionNumber,
}) {
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
                  submittedTime: format(
                    ad.reviewedAt,
                    "MMMM dd, yyyy h:mm aaa",
                  ),
                  displayText: "Reviewed by",
                  dateToCompare: new Date(ad.reviewedAt).valueOf(),
                });
              } else if (ad.modifiedBy && ad.modifiedBy === "system") {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: format(
                    ad.modifiedDate,
                    "MMMM dd, yyyy h:mm aaa",
                  ),
                  displayText: "Published by",
                  dateToCompare: new Date(ad.modifiedDate).valueOf(),
                };

                if (ad.removalDate) {
                  record.displayText = "Removed by";
                }
                advisoriesHistory.push(record);
              } else if (!ad.modifiedDate && ad.createdDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.submittedBy,
                  submittedTime: format(
                    ad.createdDate,
                    "MMMM dd, yyyy h:mm aaa",
                  ),
                  displayText: "Requested by",
                  dateToCompare: new Date(ad.createdDate).valueOf(),
                };

                advisoriesHistory.push(record);
              } else if (ad.modifiedDate) {
                const record = {
                  revisionNumber: ad.revisionNumber,
                  submitter: ad.modifiedBy,
                  submittedTime: format(
                    ad.modifiedDate,
                    "MMMM dd, yyyy h:mm aaa",
                  ),
                  displayText: "Updated by",
                  dateToCompare: new Date(ad.modifiedDate).valueOf(),
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
    // Re-fetch data if the revision number changes, which indicates new versions and history to display
    revisionNumber,
    auth.isAuthenticated,
    auth.isLoading,
    setAdvisoryHistory,
    cmsGet,
  ]);
  return (
    <div className="act-history-container px-3">
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
  revisionNumber: PropTypes.number,
};
